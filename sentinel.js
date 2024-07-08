// Load dataset Sentinel-2
var sentinel2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                .filterBounds(study_area)
                .filterDate('2021-01-01', '2021-12-31')
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));

// Fungsi untuk masking awan
function maskS2clouds(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(
             qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask).divide(10000);
}

var cloudMasked = sentinel2.map(maskS2clouds);

// Menghitung NDVI untuk setiap citra dalam dataset
var addNDVI = function(image) {
  var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
  return image.addBands(ndvi);
};

var datasetWithNDVI = cloudMasked.map(addNDVI);

// Gabungkan median NDVI untuk periode yang ditentukan
var medianNDVI = datasetWithNDVI.select('NDVI').median().clip(study_area);

// Membuat layer untuk klasifikasi vegetasi dan non-vegetasi
var veg = medianNDVI.gt(0.3).selfMask();
var nonVeg = medianNDVI.lte(0.3).selfMask();


// Arahkan ke studi area saja
Map.centerObject(study_area, 10);

// Tambahkan layer vegetasi (NDVI > 0.3) dengan palet warna hijau
Map.addLayer(veg, {palette: ['green']}, 'Vegetasi');

// Tambahkan layer non-vegetasi (NDVI <= 0.3) dengan palet warna merah
Map.addLayer(nonVeg, {palette: ['red']}, 'Non-Vegetasi');

// Ekspor data NDVI median ke Google Drive
Export.image.toDrive({
  image: medianNDVI,
  description: 'NDVI_Sentinel_AcehUtara_2021',
  scale: 30,
  region: study_area,
  fileFormat: 'GeoTIFF',
  folder: 'GEE_Exports'
});
