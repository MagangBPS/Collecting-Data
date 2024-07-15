var dataset = ee.ImageCollection('LANDSAT/LC08/C02/T1_TOA')
              .filterBounds(study_area)
              .filterDate('2021-01-01', '2021-12-31')
              // .filterMetadata('CLOUD_COVER','less_than',20)
              // .sort('CLOUD_COVER', true);
              // print(dataset);

// Fungsi untuk masking awan dan bayangan 
function maskL8sr(image) {
  var cloudShadowBitMask = (1 << 3); 
  var cloudsBitMask = (1 << 5); 

  // Dapatkan band QA_PIXEL
  var qa = image.select('QA_PIXEL');

  // Semua mask awan dan bayangan diatur ke 0 (false)
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
             .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  
  return image.updateMask(mask);
}

var cloudMaskedDataset = dataset.map(maskL8sr);

// Menghitung NDVI untuk setiap citra dalam dataset
var addNDVI = function(image) {
  var ndvi = image.normalizedDifference(['B5', 'B4']).rename('NDVI');
  return image.addBands(ndvi);
};

var datasetWithNDVI = cloudMaskedDataset.map(addNDVI);

// Gabung median NDVI untuk liat pd periode tertentu
var medianNDVI = datasetWithNDVI.select('NDVI').median().clip(study_area);

// Membuat layer untuk klasifikasi vegetasi dan non-vegetasi
var veg = medianNDVI.gt(0.6).selfMask();
var nonVeg = medianNDVI.lte(0.6).selfMask();

Map.centerObject(study_area, 10);

// Tambahkan layer vegetasi (NDVI > 0.33) dengan warna hijau
Map.addLayer(veg, {palette: ['green']}, 'Vegetasi');

// Tambahkan layer non-vegetasi (NDVI <= 0.33) dengan warna merah
Map.addLayer(nonVeg, {palette: ['red']}, 'Non-Vegetasi');

// Tampilkan citra NDVI pada peta
Map.addLayer(medianNDVI, {min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'Median NDVI');

// FIX Ekspor data NDVI median ke Google Drive
Export.image.toDrive({
  image: medianNDVI,
  description: '0.33Landsat_NDVI_AcehUtara_2021',
  scale: 30,
  region: study_area,
  fileFormat: 'GeoTIFF',
  folder: 'GEE_Exports'
});