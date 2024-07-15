// Load dataset 
var datasetSentinel = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                .filterBounds(study_area)
                .filterDate('2021-01-01', '2021-12-31')
                .filterMetadata('CLOUDY_PIXEL_PERCENTAGE','less_than',20)

// Fungsi untuk masking awan
function maskS2clouds(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(
             qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask).divide(10000);
}

var cloudMasked = datasetSentinel.map(maskS2clouds);

// Menghitung NDVI untuk setiap citra dalam dataset
var addNDVI = function(image) {
  var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
  return image.addBands(ndvi);
};

var datasetWithNDVI = cloudMasked.map(addNDVI);

// Gabungkan median NDVI untuk periode yang ditentukan
var medianNDVI = datasetWithNDVI.select('NDVI').median().clip(study_area);

// Buat layer untuk klasifikasi vegetasi dan non-vegetasi
var veg = medianNDVI.gt(0.33).selfMask();
var nonVeg = medianNDVI.lte(0.33).selfMask();

Map.centerObject(study_area, 10);

// Tambah layer vegetasi (NDVI > 0.3) jadi warna hijau
Map.addLayer(veg, {palette: ['green']}, 'Vegetasi');

// Tambah layer non-vegetasi (NDVI <= 0.3) jadi warna merah
Map.addLayer(nonVeg, {palette: ['red']}, 'Non-Vegetasi');

// Ekspor data NDVI median ke Google Drive
Export.image.toDrive({
  image: medianNDVI,
  description: 'Sentinel_NDVI_AcehUtara_2021',
  scale: 30,
  region: study_area,
  fileFormat: 'GeoTIFF',
  folder: 'GEE_Exports'
});