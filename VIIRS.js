// Load the VIIRS dtaset
var dataset = ee.ImageCollection('NOAA/VIIRS/DNB/ANNUAL_V22')
                .filterBounds(study_area)
                .filterDate('2022-01-01','2022-12-31')

// ambil rata2 dr kesluruhan 
var avgRad = dataset.select('average').mean().clip(study_area);
print(avgRad)

// // var avgRad_median = avgRad.median()
// var avgRad = avgRad.clip(study_area)

var vis_nightTime = {min: 0, max:20, palette: ['black','white']}
//'blue','purple','cyan','green', 'yellow','red'

Map.addLayer(avgRad, vis_nightTime)
Map.centerObject(study_area,10)

//Export tiff file ke Google Drive
Export.image.toDrive({
  image: avgRad,
  description: '2022_NTL_AcehUtara_AVG',
  scale: 500,
  region: study_area,
  fileFormat: 'GeoTIFF',
  folder: 'GEE_Exports'
});
