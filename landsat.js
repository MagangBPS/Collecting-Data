var dataset = ee.ImageCollection('LANDSAT/LC08/C02/T1_TOA')
              .filterBounds(study_area)
              .filterDate('2021-01-01', '2021-12-31')
              .filterMetadata('CLOUD_COVER','less_than',20)
              .sort('CLOUD_COVER', true);
              // print(dataset);
              
// Menghitung NDVI untuk setiap citra dalam dataset
var addNDVI = function(image) {
  var ndvi = image.normalizedDifference(['B5', 'B4']).rename('NDVI');
  return image.addBands(ndvi);
};

var datasetWithNDVI = dataset.map(addNDVI);

// Gabungkan median NDVI untuk periode yang ditentukan
var medianNDVI = datasetWithNDVI.select('NDVI').median().clip(study_area);

//Membuat layer untuk klasifikasi vegetasi dan non-vegetasi
var veg = medianNDVI.gt(0.3).selfMask();
var nonVeg = medianNDVI.lte(0.3).selfMask();

//Tampilkan layer vegetasi dan non-vegetasi pada peta
// Pusatkan peta pada area studi
Map.centerObject(study_area, 10);

// Tambahkan layer vegetasi (NDVI > 0.3) dengan palet warna hijau
Map.addLayer(veg, {palette: ['green']}, 'Vegetasi');

// Tambahkan layer non-vegetasi (NDVI <= 0.3) dengan palet warna merah
Map.addLayer(nonVeg, {palette: ['red']}, 'Non-Vegetasi');

// Ekspor data NDVI median ke Google Drive
Export.image.toDrive({
  image: medianNDVI,
  description: 'NDVI_ProvinsiAceh_2021',
  scale: 30,
  region: study_area,
  fileFormat: 'GeoTIFF',
  folder: 'GEE_Exports'
});


