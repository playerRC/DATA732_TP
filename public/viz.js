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

// fonction pour générer des "fake" groups pour pouvoir regrouper plusieurs colonnes sur le même chart
function combine_groups(groups) {
    return {
        all: function() {
            var parts = Object.keys(groups).map(function(gk) {
                return groups[gk].all().map(function(kv) {
                    return {key: [gk, kv.key], value: kv.value};
                })
            });
            return Array.prototype.concat.apply([], parts);
        }
    };
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
    var chart4 = dc.seriesChart("#chart4", groupName);

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

    // chart 4
    var seriesDimension = mycrossfilter.dimension(function(dataset) { 
        return dataset["Hours per day"];
    });
    var depressionGroup = seriesDimension.group().reduceSum(function(d){ return d["Depression"]; });
    var anxietyGroup = seriesDimension.group().reduceSum(function(d){ return d["Anxiety"]; });
    var insomniaGroup = seriesDimension.group().reduceSum(function(d){ return d["Insomnia"]; });
    var ocdGroup = seriesDimension.group().reduceSum(function(d){ return d["OCD"]; });
    // regrouper les data
    var seriesGroup = combine_groups({
        depression: depressionGroup,
        anxiety: anxietyGroup,
        insomnia: insomniaGroup,
        OCD: ocdGroup
    });


    // set up des groups/values
    var musEffectsGroup = musEffectsDimension.group().reduceCount();
    var hoursGroup = hoursDimension.group().reduceCount();
    var heatGroup = heatDimension.group().reduceCount();

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
        .chart(function(c) { 
            return dc.lineChart(c).curve(d3.curveCardinal); 
         })
        .x(d3.scaleLinear().domain([0,24]))
        .brushOn(false)
        .yAxisLabel("Niveau")
        .xAxisLabel("Nombre d'heures")
        .dimension(seriesDimension)
        .group(seriesGroup)
        .seriesAccessor(function(d) {return d.key[0];})
        .keyAccessor(function(d) {return d.key[1];})
        .legend(dc.legend().x(50).y(20).itemHeight(13).gap(5).horizontal(2).legendWidth(1360).itemWidth(70));

    // On veut rendre tous les graphiques qui proviennent du chart group "dataset"
    dc.renderAll(groupName);
}