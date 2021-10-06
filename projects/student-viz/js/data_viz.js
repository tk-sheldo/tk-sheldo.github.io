/**
 * @fileoverview Displays student usage data chart using d3
 */


// variables globales

const datafile_name = "studentData";

const graph = d3.select(".graph");
const svg_width = parseInt(graph.style("width")) - (parseInt(graph.style("padding-left")) + parseInt(graph.style("padding-right")));
const svg_height = parseInt(d3.select(".graph").style("height")) - (parseInt(d3.select(".graph").style("padding-top")) + parseInt(d3.select(".graph").style("padding-bottom")));

const dot_opacity = .5;
const dot_radius = 2;
const text_box_opacity = .7;

//fetch student data from local storage

if (localStorage.getItem(datafile_name) !== null) {
    var data = JSON.parse(localStorage.getItem(datafile_name)); 
}
else {
	alert("Error: Student data missing.");
}


//sort data into groups

grouped_data = [[], []]

for (var i = 0; i < data.length; i++) {
	group = data[i].grupo-1;  // 1-2 -> 0-1
	grouped_data[group].push(data[i]);
}

//legend

low_pretest_color = "green"
high_pretest_color = "orange"

d3.select("#legend").selectAll("circle")
	.attr("fill", low_pretest_color)
	.attr("opacity", dot_opacity);

d3.select("#high-pretest").select("circle")
	.attr("fill", high_pretest_color)

/**
 * Reduces opacity of all dots in graphs with the given pretest value 
 * @param pretest_val - 1 (low) or 2 (high)
 */
function dim_pretest(pretest_val) {
	
	d3.selectAll(".graph").selectAll("circle").transition().attr("fill-opacity", function(d) {
		if (d.Pretest == pretest_val) {
			return dot_opacity*.1;
		}
		else {
			return dot_opacity;
		}
	});
}

d3.selectAll("#low-pretest")
	.data([1])
	.on("mouseover", dim_pretest)
	.on("mouseout", function() {
		d3.selectAll(".graph").selectAll("circle").transition().attr("fill-opacity", dot_opacity);
	});

d3.selectAll("#high-pretest")
	.data([2])
	.on("mouseover", dim_pretest)
	.on("mouseout", function() {
		d3.selectAll(".graph").selectAll("circle").transition().attr("fill-opacity", dot_opacity);
});


const y_axis_width = 100;
const x_axis_height = 25;

//escalas

var date_scale = d3.scaleTime()
	.domain([new Date(2016, 8, 20), new Date(2016, 11, 20)])
    .range([20, svg_width - y_axis_width]);

var nivel_scale = d3.scaleLinear()
	.domain([0, 15])	
	.range([svg_height - x_axis_height, 0]); // inverted

var activity_scale = d3.scaleLinear()
	.domain([0, 169])
	.range([1, 5]);


// ejes

var date_axis = d3.axisBottom(date_scale)
	.ticks(6);

var nivel_names = ["variables", "comparisons", "if statements", "logical operators", 
	"loops", "output formatting", "functions", "lists", "strings", "dictionaries", 
	"values references", "exceptions", "file handling", "classes & objects"]; 

var nivel_axis = d3.axisRight(nivel_scale)
	.ticks(14)
	.tickFormat(function(i) {
		return nivel_names[i];
	});

/**
 * Draws a dot chart on a given svg based on chart_data
 * @param svg - the svg canvas that the chart is to be drawn onto
 * @param chart_name - the name of the chart, for display purposes
 * @param chart_data - the data that the chart should display
 */
function drawChart(svg, chart_name, chart_data) {
	
	svg.selectAll("circle")
		.data(chart_data) 
		.enter()
		.append("circle")
		.attr("r", function(d) {
			return dot_radius * activity_scale(d.total_act);
		})
		.attr("cx", function(d) {
			return date_scale(d.Time);
		})
		.attr("cy", function(d) {
			return nivel_scale(d.topicorder);
		})
		.attr("fill", function(d) {
			if (d.Pretest == 2) {
				return "green";
			}
			else {
				return "orange";
			}
		})
		.attr("class", function(d) {
			return d.usuario;
		})
		.attr("fill-opacity", dot_opacity)
		

	
	// axes

	var x_axis = svg.append('svg')
		.attr('class','x-axis-coor')
		.attr("x", 0)
		.attr("y", "90%")
		.attr("width", "100%")
		.attr("height", "10%");

	x_axis.append('rect')
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", "100%")
		.attr("height", "100%")
		.attr("class", "axes")
		.attr("fill", "url(#grad2)")

	x_axis.append("g")
		.attr("id", "x_axis")
		.attr("class", "axis")
		.call(date_axis);



	var y_axis = svg.append('svg')
		.attr('class','y-axis-coor')
		.attr("x", "80%")
		.attr("y", 0)
		.attr("width", "20%")
		.attr("height", "100%")
	
	y_axis.append('rect')
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", "100%")
		.attr("height", "100%")
		.attr("fill", "url(#grad1)")

	y_axis.append("g")
		.attr("id", "y_axis")
		.attr("class", "axis")
		.call(nivel_axis);
	
	
	// dialogue box
	svg.append("text")
		.attr("id", "dialogue_box")
		.attr("transform", "translate(5, 15)")
		.style("opacity", text_box_opacity)
		.text(chart_name);
			
}


drawChart(d3.select("#Chart1"), "Section A", grouped_data[0]);
drawChart(d3.select("#Chart2"), "Section B", grouped_data[1]);


// -------------------------- EVENT HANDLING -------------------------------


// el raton
d3.selectAll(".graph").selectAll("circle")

	.on("mouseover", function(d) {
		let parent_svg = d3.select(this.parentNode);
		

		parent_svg.selectAll("circle")
			.transition()
    		.attr("fill-opacity", function(d2) {
    			if (d.usuario != d2.usuario) {
    				return .1;  // otros alumnos se apagan
    			}
    			else {
    				return .8;  // este alumno se hace mas solido
    			}  
    		})

		// texto
		let detail_text = d.usuario.concat(" — ").concat(nivel_names[d.topicorder]);
		
		parent_svg.select("#dialogue_box")
			.text(detail_text)
			.transition()
			.duration(400)
			.style("opacity", text_box_opacity);

	})		
	
	// todo regresa a normal
	.on("mouseout", function(d) {
		var parent_svg = d3.select(this.parentNode);
		
		// los putos regresa a normal
		parent_svg.selectAll("circle")
			.transition()
			.delay(100)
	    	.attr("fill-opacity", dot_opacity);
		
		// texto
		parent_svg.select("#dialogue_box")
			.text(parent_svg.attr("id"))
			.transition()
			.duration(400)
			.style("opacity", text_box_opacity);

	});


// zoom

// crea el zoom
var zoom_handler = d3.zoom()
	.on("zoom", do_the_zoom)
	.scaleExtent([1,8])
	.translateExtent([[0, 0], [svg_width, svg_height]]);

// donde escuchar el zoom
d3.selectAll(".graph").call(zoom_handler);

// que pasa en el zoom
function do_the_zoom() {
	var current_svg = d3.select(this);
	var el_transform = d3.event.transform;
	var scale_factor = el_transform.scale(1).k;
	
	// transforma todos los circulos
	d3.selectAll(".graph").selectAll("circle")
		.attr("transform", el_transform)
		// mantiene un radio chico
		.attr("r", function(d) {
			return (activity_scale(d.total_act) * dot_radius/(Math.sqrt(scale_factor)));
		});
	
	// selecciona los otros svgs
	var other_svgs = d3.selectAll(".graph").filter( function() {
		return d3.select(this).attr("id") !== current_svg.attr("id");
	});
	
	// transforma los ejes
	d3.selectAll("#x_axis")
		.call(date_axis.scale(d3.event.transform.rescaleX(date_scale)));
	d3.selectAll("#y_axis")
		.call(nivel_axis.scale(d3.event.transform.rescaleY(nivel_scale)));
	
	// rompe un tipo de bucle - https://groups.google.com/forum/#!topic/d3-js/_36l7uHNYsQ
	if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') { return; }
	zoom_handler.transform(other_svgs, d3.event.transform);
	
}



