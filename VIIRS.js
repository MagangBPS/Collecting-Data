// Load the VIIRS Annual Nighttime Lights dataset.
var dataset = ee.ImageCollection('NOAA/VIIRS/DNB/ANNUAL_V21')
                .filterBounds(study_area)
                .filterDate('2021-01-01', '2021-12-31')

// Calculate the average radiance for each image in the dataset
var avgRad = dataset.select('average');

var avgRad_median = avgRad.median()
var clip_avgRad_median = avgRad_median.clip(study_area)

var vis_nightTime = {min: 0, max:20, palette: ['black','blue','purple','cyan','green', 'yellow','red']}
//

Map.addLayer(clip_avgRad_median, vis_nightTime)
Map.centerObject(study_area,10)

//Export the nighttime lights data to Google Drive
Export.image.toDrive({
  image: clip_avgRad_median,
  description: 'NighttimeLights_AcehUtara_2021_MAX20',
  scale: 500,
  region: study_area,
  fileFormat: 'GeoTIFF',
  folder: 'GEE_Exports'
});
