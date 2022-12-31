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
        d["Music effects"] = d["Music effects"] === "Improve";

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

    //déclararion du crossfilter
    var mycrossfilter = crossfilter(dataset);

    // set up des dimensions
    var musEffectsDimension = mycrossfilter.dimension(function(dataset) { 
        return dataset["Music effects"];
    });
    var hoursDimension = mycrossfilter.dimension(function(dataset) { 
        return dataset["Hours per day"];
    });

    // set up des groups/values
    var musEffectsGroup = musEffectsDimension.group().reduceCount();
    var hoursGroup = hoursDimension.group().reduceCount();

    chart1
        .dimension(musEffectsDimension)
        .group(musEffectsGroup)
        .colors(["rgb(255,0,0)","rgb(0,255,0)"])
        .on('renderlet', function(chart) {
            montrerPourcentagesPieChart(chart);
         });

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
    

    // On veut rendre tous les graphiques qui proviennent du chart group "dataset"
    dc.renderAll(groupName);
}