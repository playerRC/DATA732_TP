/**
 * On crée la variable qui contiendra le nom du groupe de graphique du dashboard
 */
const groupName = "dataset";

/**
 * Fonction pour reset les filtres et redessiner les graphiques
 */
function reset() {
    dc.filterAll(groupName);
    dc.renderAll(groupName);
}

/**
 * Permet de montrer les % des tranches du pie chart
 * @param chart Le pie chart sur quoi faire la modification
 */
const montrerPourcentagesPieChart = (chart) => {
    chart.selectAll('text.pie-slice').text(function (d) {
        if (((d.endAngle - d.startAngle) / (2 * Math.PI) * 100) !== 0) {
            return dc.utils.printSingleValue(Math.round((d.endAngle - d.startAngle) / (2 * Math.PI) * 100)) + '%';
        }
    })
}

/**
 * La fonction pour créer la visualisation
 */
async function createDataViz() {

    // On récupère le dataset et on le met dans la variable dataset
    let dataset = await d3.csv("/data/survey.csv");

    // On formate un peu la donnée pour nous éviter des soucis
    dataset.forEach((d) => {

        d["While working"] = d["While working"] === "Yes";
        d["Instrumentalist"] = d["Instrumentalist"] === "Yes";
        d["Composer"] = d["Composer"] === "Yes";
        d["Exploratory"] = d["Exploratory"] === "Yes";
        d["Foreign languages"] = d["Foreign languages"] === "Yes";

        d["Age"] = +d["Age"];
        d["Hours per day"] = +d["Hours per day"];
        d["BPM"] = +d["BPM"];
        d["Anxiety"] = +d["Anxiety"];
        d["Depression"] = +d["Depression"];
        d["Insomnia"] = +d["Insomnia"];
        d["OCD"] = +d["OCD"];

        d["Timestamp"] = new Date(d["Timestamp"]);
    });

    // déclaration des charts
    var chart1 = dc.pieChart("#chart1", groupName);
    var chart2 = dc.barChart("#chart2", groupName);
    var chart3 = dc.heatMap("#chart3", groupName);
    var chart4 = dc.pieChart("#chart4", groupName);

    //déclararion du crossfilter
    var mycrossfilter = crossfilter(dataset);

    // set up des dimensions
    var musEffectsDimension = mycrossfilter.dimension(function(dataset) { 
        return dataset["Music effects"];
    });
    var hoursDimension = mycrossfilter.dimension(function(dataset) { 
        return dataset["Hours per day"];
    });
    var heatDimension = mycrossfilter.dimension(function(dataset) { 
        return [dataset["While working"], dataset["Anxiety"]];
    });
    var favGenreDimension = mycrossfilter.dimension(function(dataset) { 
        return dataset["Fav genre"];
    });

    // set up des groups/values
    var musEffectsGroup = musEffectsDimension.group().reduceCount();
    var hoursGroup = hoursDimension.group().reduceCount();
    var heatGroup = heatDimension.group().reduceCount();
    var favGenreGroup = favGenreDimension.group().reduceCount();

    chart1
        .dimension(musEffectsDimension)
        .group(musEffectsGroup)
        .on('renderlet', function(chart) {
            montrerPourcentagesPieChart(chart);
        })
        .legend(dc.legend().x(50).y(20));

    chart2
        .x(d3.scaleLinear().domain([0,25]))
        .yAxisLabel("Nombre de personnes")
        .xAxisLabel("Nb heures")
        .dimension(hoursDimension)
        .group(hoursGroup)
        .on('renderlet', function(chart2) {
            chart2.selectAll('rect').on('click', function(d) {
               console.log('click!', d);
            });
         });

    chart3
        .dimension(heatDimension)
        .group(heatGroup)
        .keyAccessor(function(d) { return d.key[0]; })
        .valueAccessor(function(d) { return d.key[1]; })
        .colorAccessor(function(d) { return +d.value; })
        .title(function(d) {
                return "While working?   " + d.key[0] + "\n" +
                        "Anxiety level:  " + d.key[1] + "\n" +
                        "Nombre de personnes: " + d.value;
            })
        .colors(["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"])
        .calculateColorDomain()

    chart4
        .dimension(favGenreDimension)
        .group(favGenreGroup)
        .on('renderlet', function(chart) {
            montrerPourcentagesPieChart(chart);
        })
        .legend(dc.legend().x(50).y(20));

    // pour le chart 5
    var xAxisDimension = mycrossfilter.dimension(function(d) { return d["Hours per day"]; });
    
    var insomniaGroup = xAxisDimension.group().reduce(
        function(p, v) {p.count++; p.total += v["Insomnia"]; p.average = p.total/p.count; return p;},
        function(p, v) {p.count--;if (p.count == 0) {p.total = 0; p.average = 0;} else {p.total -= v["Insomnia"];p.average = p.total/p.count;}return p;},
        function() {return {count: 0, total: 0, average: 0};});
    var OCDGroup = xAxisDimension.group().reduce(
        function(p, v) {p.count++; p.total += v["OCD"]; p.average = p.total/p.count; return p;},
        function(p, v) {p.count--;if (p.count == 0) {p.total = 0; p.average = 0;} else {p.total -= v["OCD"];p.average = p.total/p.count;}return p;},
        function() {return {count: 0, total: 0, average: 0};});
    var depressionGroup = xAxisDimension.group().reduce(
        function(p, v) {p.count++; p.total += v["Depression"]; p.average = p.total/p.count; return p;},
        function(p, v) {p.count--;if (p.count == 0) {p.total = 0; p.average = 0;} else {p.total -= v["Depression"];p.average = p.total/p.count;}return p;},
        function() {return {count: 0, total: 0, average: 0};});
    var anxietyGroup = xAxisDimension.group().reduce(
        function(p, v) {p.count++; p.total += v["Anxiety"]; p.average = p.total/p.count; return p;},
        function(p, v) {p.count--;if (p.count == 0) {p.total = 0; p.average = 0;} else {p.total -= v["Anxiety"];p.average = p.total/p.count;}return p;},
        function() {return {count: 0, total: 0, average: 0};});

    var chart5 = dc.lineChart('#chart5', groupName);
    chart5
        .dimension(xAxisDimension)
        .renderArea(true) 
        .x(d3.scaleLinear().domain([0, 24]))
        .xAxisLabel("Nb heures")
        .yAxisLabel("Somme moyenne troubles mentaux")
        .brushOn(false)
        .legend(dc.legend().x(80).y(20).itemHeight(13).gap(5))
        .title(function(d) {
        return 'Nb heures: '+d.key + ', Moyenne de niveau du trouble mental: ' + d.value.average;
        })
        .group(insomniaGroup, 'Insomnia', function(d) {
            return d.value.average;
          })
        .stack(OCDGroup, 'OCD', function(d) {
            return d.value.average;
          })
        .stack(depressionGroup, 'Depression', function(d) {
            return d.value.average;
          })
        .stack(anxietyGroup, 'Anxiety', function(d) {
        return d.value.average;
        });

    var xAxisDimension = mycrossfilter.dimension(function(d) { return d["Hours per day"]; });
    var ageGroup = xAxisDimension.group().reduce(
        function(p, v) {p.count++; p.total += v["Age"]; p.average = p.total/p.count; return p;},
        function(p, v) {p.count--;if (p.count == 0) {p.total = 0; p.average = 0;} else {p.total -= v["Age"];p.average = p.total/p.count;}return p;},
        function() {return {count: 0, total: 0, average: 0};});
    
    var chart6 = dc.lineChart('#chart6', groupName);
    chart6
        .dimension(xAxisDimension)
        .xAxisLabel("Nb heures")
        .yAxisLabel("Age moyen")
        .x(d3.scaleLinear().domain([0, 24]))
        .y(d3.scaleLinear().domain([17, 55]))
        .legend(dc.legend().x(80).y(20).itemHeight(13).gap(5))
        .brushOn(false)
        .title(function(d) {
        return 'Nombres d\'heures: '+d.key + ', Age moyen: ' + d.value.average;
        })
        .group(ageGroup, 'Age', function(d) {
            return d.value.average;
        });

    // On veut rendre tous les graphiques qui proviennent du chart group "dataset"
    dc.renderAll(groupName);
}