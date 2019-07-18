////////////////////////////////////////////////////////////////////////////
// This script uses MODIS 1km NDVI product and it is spatially            //
// correlate with SPEI calculated from NOAH Global Land Assimulation      //
// System data. It will display and export the correlation map of SPEI vs //
// three months sum of NDVI anomalies. (spearson/pearson's correlation)   //
//------------------------------------------------------------------------//
// For fast global study                                                  //
// Contact: Shunan Feng (冯树楠): fsn.1995@gmail.com                      //
////////////////////////////////////////////////////////////////////////////


//------------------------------------------------------------------------//
//                             Preparation                                //
//------------------------------------------------------------------------//


var worldmap = ee.FeatureCollection('ft:1tdSwUL7MVpOauSgRzqVTOwdfy17KDbw-1d9omPw');//world vector
// var usstate = ee.FeatureCollection('ft:1fRY18cjsHzDgGiJiS2nnpUU3v9JPDc2HNaR7Xk8');//us state vector
// // var worldmap = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017'); //not political right, 
// // var country = ['Spain'];//CHANGE the NAME of country here!
// var state = ['California'];//CHANGE the NAME of us state here!
// var worldmap = ee.FeatureCollection('ft:1Ec8IWsP8asxN-ywSqgXWMuBaxI6pPaeh6hC64lA');//world vector

// var countryshape = worldmap.filter(ee.Filter.inList('Country', country));// country 
// var stateshape = usstate.filter(ee.Filter.inList('Name', state));// us state
var roi = worldmap.geometry();// country 
// var roi = stateshape.geometry();// us state
// var roiLayer = ui.Map.Layer(roi, {color: 'FF0000'}, 'roi');
// // var roiCentroid = roi.centroid();
// Map.layers().add(roiLayer);//display roi
// // Map.setCenter(roiCentroid);

// study time range
var year_start = 2001;
var year_end = 2018;
// month range of ndvi anomalies (May to July)
// var month_start = 5;
// var month_end = 7;
var speim = 4;// month of spei 
// var month_start = speim + 1;
// var month_end = speim + 3;
var month_start = 1;
var month_end = 12;

var date_start = ee.Date.fromYMD(year_start, 1, 1);
var date_end = ee.Date.fromYMD(year_end, 12, 31);
var years = ee.List.sequence(year_start, year_end);// time range of years
var months = ee.List.sequence(month_start, month_end);// time range of months


//------------------------------------------------------------------------//
//                               Datainput                                //
//------------------------------------------------------------------------//

// load MODIS NDVI 2000-02-18T00:00:00 - Present
var ndvi = ee.ImageCollection('MODIS/006/MOD13A2')
    .filterDate(date_start, date_end)
    .select('NDVI');

var spei1m = ee.ImageCollection("users/fsn1995/spei1m_noah");
var spei2m = ee.ImageCollection("users/fsn1995/spei2m_noah");
var spei3m = ee.ImageCollection("users/fsn1995/spei3m_noah");
var spei4m = ee.ImageCollection("users/fsn1995/spei4m_noah");
var spei5m = ee.ImageCollection("users/fsn1995/spei5m_noah");
var spei6m = ee.ImageCollection("users/fsn1995/spei6m_noah");
// select the time scale of spei here
var spei = spei3m;

// load land cover data
var lucc = ee.Image('USGS/NLCD/NLCD2011').select('landcover');
// monthly average NDVI
// sytstem time is set as 1st of each month
var NDVI_monthlyave = ee.ImageCollection.fromImages(
    years.map(function (y) {
        return months.map(function(m) {
            var vi = ndvi.select('NDVI')
                                .filter(ee.Filter.calendarRange(y, y, 'year'))
                                .filter(ee.Filter.calendarRange(m, m, 'month'))
                                .mean()
                                .rename('NDVIm');
            return vi.set('year', y)
                     .set('month', m)
                     .set('system:time_start', ee.Date.fromYMD(y, m, 1));
        });
    }).flatten()
);

// 20yr monthly average NDVI
var NDVI_30yrave = ee.ImageCollection.fromImages(
    months.map(function (m) {
        var vi = NDVI_monthlyave.filter(ee.Filter.eq('month', m))
                                .mean()
                                .rename('NDVIy');
        return vi.set('month', m);
    }).flatten()
);
// print(NDVI_30yrave);

// NDVI anomaly = monthly average NDVI - 30yr monthly average NDVI 
// NDVI monthly anomaly
var monthfilter = ee.Filter.equals({
    leftField: 'month',
    rightField: 'month',
});
var monthlink = ee.Join.saveFirst({
    matchKey: 'match',
});

var NDVI_monthlink = ee.ImageCollection(monthlink.apply(NDVI_monthlyave,NDVI_30yrave,monthfilter))
    .map(function(image) {
        return image.addBands(image.get('match'));
    });
                             
var addNDVI_anomaly = function(image) {
    var anomaly = image.expression(
        'b1-b2',
        {
            b1: image.select('NDVIm'),
            b2: image.select('NDVIy'),
        }
    ).rename('NDVI_anomaly');
    return image.addBands(anomaly);
};
                            
var NDVI_anomaly = NDVI_monthlink.map(addNDVI_anomaly);

//------------------------------------------------------------------------//
//                                  Lag                                   //
//------------------------------------------------------------------------//
// lag is achieved by shifting the date of the data

var addLag0m = function(image) {
    var lagm = ee.Date(image.get('system:time_start')).advance(0,'month');
    return image.set({'lagm': lagm});
};

var addLag1m = function(image) {
    var lagm = ee.Date(image.get('system:time_start')).advance(-1,'month');
    return image.set({'lagm': lagm});
};

var addLag2m = function(image) {
    var lagm = ee.Date(image.get('system:time_start')).advance(-2,'month');
    return image.set({'lagm': lagm});
};

var addLag3m = function(image) {
    var lagm = ee.Date(image.get('system:time_start')).advance(-3,'month');
    return image.set({'lagm': lagm});
};

var addLag4m = function(image) {
    var lagm = ee.Date(image.get('system:time_start')).advance(-4,'month');
    return image.set({'lagm': lagm});
};

var addLag5m = function(image) {
    var lagm = ee.Date(image.get('system:time_start')).advance(-5,'month');
    return image.set({'lagm': lagm});
};

var addLag6m = function(image) {
    var lagm = ee.Date(image.get('system:time_start')).advance(-6,'month');
    return image.set({'lagm': lagm});
};

// compute three month sum ndvi anomaly

var NDVI0 = NDVI_anomaly.select('NDVI_anomaly').map(addLag0m);
var NDVI1 = NDVI_anomaly.select('NDVI_anomaly').map(addLag1m);
var NDVI2 = NDVI_anomaly.select('NDVI_anomaly').map(addLag2m);

var lagFilter = ee.Filter.equals({
    leftField: 'lagm',
    rightField: 'lagm',
});
var lagLink = ee.Join.saveFirst({
    matchKey: 'match',
});

var NDVI_threeMonthAnomaly = ee.ImageCollection(lagLink.apply(NDVI0.select('NDVI_anomaly'),
        NDVI1.select('NDVI_anomaly'),lagFilter))
        .map(function(image) {
            return image.addBands(image.get('match'));
        });


var NDVI_threeMonthAnomaly = ee.ImageCollection(lagLink.apply(NDVI_threeMonthAnomaly,
        NDVI2.select('NDVI_anomaly'),lagFilter))
        .map(function(image) {
            return image.addBands(image.get('match'));
        });

var NDVI_anomaly_sum = NDVI_threeMonthAnomaly.map(function(image) {
    return image.addBands(
        image.expression('a1 + b1 + c1', {
            a1: image.select('NDVI_anomaly'),
            b1: image.select('NDVI_anomaly_1'),
            c1: image.select('NDVI_anomaly_2'),
        }).rename('NDVI_anomalySum'));
});

// change the lag of ndvi anomaly sum here!!!
var NDVI_anomSumMLag = NDVI_anomaly_sum.select('NDVI_anomalySum').map(addLag3m);


//------------------------------------------------------------------//
// This part compares NDVI anomalies with spei2m computed from NOAH //
// Global land assimulation system                                  //
//------------------------------------------------------------------//

var speiSet = spei.map(function(image) {
    return image.set('date', image.date());
  });
var timescaleFilter = ee.Filter.equals({
    leftField: 'lagm',
    rightField: 'date',
});  
// print(speiSet,'speiSet');
var NDVI3mLag_spei = ee.ImageCollection(lagLink.apply(NDVI_anomSumMLag.select('NDVI_anomalySum'),
        speiSet.select('b1'),timescaleFilter))
        .map(function(image) {
            return image.addBands(image.get('match'));
        });

var corrmap = NDVI3mLag_spei.reduce(ee.Reducer.pearsonsCorrelation()); 
//                        //.addBands(lucc.select('landcover').rename('lucc'));
// // var corrmap = NDVI_spei.reduce(ee.Reducer.spearmansCorrelation()).clip(roi);
//                     // .addBands(lucc.select('landcover').rename('lucc'));

var corrParams = {min: -1, max: 1, palette: ['red','white', 'green']};
Map.addLayer(corrmap.select('correlation'), corrParams, 'Correlation Map');

Export.image.toDrive({
  image: corrmap,
  description: 'Correlation map of spei with ndvi anomalies',
  scale: 1000,
//   region: roi
});

// var options = {
//     // lineWidth: 1,
//     // pointSize: 2,
//     hAxis: {title: 'R and P value'},
//     vAxis: {title: 'Correlation Coefficient'},
//     title: 'Correlation map average'
// };
// var chart = ui.Chart.image.byClass(
//     corrmap, 'lucc', roi, ee.Reducer.mean(), 100000, lucc.get('landcover_class_names')
// ).setOptions(options);  
// print(chart);