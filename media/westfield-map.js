
const viz = d3.select("#viz"),
    dot_size = 4,
    zoom_speed = 2000,
    width = parseInt(viz.style("width")),
    height = parseInt(viz.style("height"))

var projection = {

    waterman: d3.geoPolyhedralWaterman()
                .rotate( [20, 0] )
                .scale(Math.min(((window.innerWidth / 6) - 16), 150))
                .translate( [width/2, height/2 ]),

    airocean: d3.geoAirocean()
                .scale(33)
                .angle(210)
                .translate( [width/2, height*(7/16) ]),

    patterson: d3.geoNaturalEarth1()
                .rotate( [-10, 0] )
                .scale(180)
                .translate( [width/2, height/2 ]),

    mercator: d3.geoMercator()
                .scale( 50 )
                .rotate( [0,0] )
                .center( [0, 0] )
                .translate( [width/2,height/2] )
}

const urls = {

    shapes: "https://raw.githubusercontent.com/tk-sheldo/westfield-map/c5e1780a78d9ab6683121ea771c1a9540cb00006/100m_countries.json",

    point_data: "https://raw.githubusercontent.com/tk-sheldo/westfield-map/4889efce42885402c7c2c0008d2ac31f8c764f6c/json_processing/joined.json"
}

var this_projection = projection.waterman
if (is_mobile()) { this_projection = projection.airocean }

const geoPathGenerator = d3.geoPath().projection(this_projection);

const graticule = d3.geoGraticule();

var zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed)
var focus = null

class ZoomHint {

    constructor() {
        this.hint = viz.select('#zoom-hint')
        this.hint.on("mousedown", reset)
        this.speed = 1000

        if (is_mobile()) {
            this.hint.style("padding", "5%")
        }
    }

    enter() {
        this.hint.style('opacity', 1)
    }

    leave() {
        this.hint.style('opacity', 0)
        //setTimeout(() => { this.hint.remove(); }, this.speed);
    }
}

class Focus {

    constructor(side, data) {

        this.side = side
        this.data = data.properties

        this.speed = 1500
        this.desktop_reading_pos = "4%"
        this.mobile_reading_pos = "2%"

        this.div = viz.append("div")

        if (is_mobile()) {
            this.div.attr("id", "mobile-focus")
        } else {
            this.div.attr("id", "focus")
        }
        
        this.fill_data()
    }

    /**
     * Fills focus html with content
     */
    fill_data() {

        var header = this.div.append("div").attr("id", "focus-header")
        header.append("img").attr("src", this.data.imageURL)


        var header_info = header.append("div").attr("id", "focus-header-info")
        header_info.append("p")
            .attr('id', 'name').html(this.data.name)
        header_info.append("p")
            .attr("id", "location")
            .html(this.data.location_name + ", " + this.data.country)

        this.div.append("div").attr("id", "focus-flavor-text")
            .append("p").html(this.data.text)
    }

    /**
     * Slides focus onto the viz
     */
    enter() {

        if (is_mobile()) {
            this.div.style("top", "-100%")
            this.div.transition()
                    .duration(this.speed)
                    .style("top", this.mobile_reading_pos);
        } else {
            if (this.side == 'L') {
                this.div.style("left", "-100%")
                this.div.transition()
                    .duration(this.speed)
                    .style("left", this.desktop_reading_pos);
            } else {
                this.div.style("right", "-100%")
                this.div.transition()
                    .duration(this.speed)
                    .style("right", this.desktop_reading_pos);
            }
        }     
    }

    /**
     * Slides focus out of the viz
     */
    leave() {

        if (is_mobile()) {
            this.div.transition()
                .duration(this.speed)
                .style("top", "-100%")
        } else {
            if (this.side == 'L') {
                this.div.transition()
                    .duration(this.speed)
                    .style("left", "-100%");
            } else {
                this.div.transition()
                    .duration(this.speed)
                    .style("right", "-100%");
            }
        }

        setTimeout(() => { this.div.remove(); }, this.speed);
    }
}

// load data for map
d3.queue()
    .defer(d3.json, urls.shapes)
    .defer(d3.json, urls.point_data)
    .await(draw_map);

function draw_map(error, shapes, point_data) {

    if (error) throw error;

    zoom_hint = new ZoomHint()

    if (!is_mobile()) {

        // draw oceans
        viz.select("#map").append('g')
            .attr('id', 'ocean')
            .append('path')
            .attr('d', geoPathGenerator({type: 'Sphere'}));

        // draw graticules
        var graticule = d3.geoGraticule();
        graticule.extent([[-180, -80],[180, 80.1]])
        viz.select("#map").append('g')
                .attr("id", "graticule")
                .append("path")
                .datum(graticule)
                .attr("d", geoPathGenerator);
    }

    // draw countries
    viz.select("#map").append( "g" )
        .attr("id", "countries")
        .selectAll( "path" )
        // Bind TopoJSON data elements, first geostiching them (for antarctica)
        .data(d3.geoStitch(topojson.feature(shapes, shapes.objects.ne_110m_admin_0_countries)).features)
        .enter().append("path")
            .attr("d", geoPathGenerator)
            .attr("id", function(d) {
                return d.properties.ADM0_A3;
            })

    // listener for zoom clicks
    viz.select("#map").append('rect')
        .attr("id", "reset-listener")
        .attr("width", width)
        .attr("height", height)
        .on("click", reset);

    viz.select("#map").append("g")
        .attr("id", "programs")
    .selectAll("circle")
        .data(point_data.features)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
            return this_projection(d.geometry.coordinates)[0]
        })
        .attr("cy", function(d) {
            return this_projection(d.geometry.coordinates)[1]
        })
        .attr("r", dot_size)
        .attr('class', function(d) {

            if (d.properties.type == "student") {
                return "student"
            }
            else {
                return "tournament"
            }
        })
        .classed('program', true)

    // program dots
    if (is_mobile()) {
        add_mobile_dot_listeners(point_data)
    } else {
        add_dot_listeners(viz.selectAll('.program'))
    }
}

/**
 * Adds listener event for non-mobile screens
 * @param {Object} program_dots D3 reference to all program dots
 */
function add_dot_listeners(program_dots) {

    program_dots.on("mousedown", function(d) {

        select(d, this)

        // calc which side focus box should enter from 
        var entrance = 'L'
        if (this.getBBox().x < width/2) { entrance = 'R' }

        // create and bring in focus box
        focus = new Focus(entrance, d)
        focus.enter()

        zoom_to(d)
    })
}

/**
 * Adds listener elements for mobile screens
 * @param {Object} point_data Program data associated with points
 */
function add_mobile_dot_listeners(point_data) {

    viz.select("#map").append("g")
        .attr("id", "program-shadows")
    .selectAll("circle")
        .data(point_data.features)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
            return this_projection(d.geometry.coordinates)[0]
        })
        .attr("cy", function(d) {
            return this_projection(d.geometry.coordinates)[1]
        })
        .attr("r", dot_size * 4)
        .on("mousedown", function(d) {

            select(d, this)

            // create and bring in focus box
            focus = new Focus('L', d)   //'L' is placeholder, doesn't matter for mobile
            focus.enter()

            zoom_to(d)
        })
}

/**
 * Handles generic (mobile-agnostic) selection of a program on the map
 * @param {Object} program_data Data associated with the selected program
 * @param {Object} program_ref Reference to the selected program
 */
function select(program_data, program_ref) {

    if (focus !== null) { focus.leave() }

    country_id = "#" + program_data.properties.ADM0_A3

    viz.select("#countries").selectAll("path")
        .classed("unselected", true);

    viz.select("#countries").select(country_id)
        .classed("unselected", false)
        .classed("selected", true)

    viz.select("#programs").selectAll("circle")
        .classed("unselected", true)
    
    d3.select(program_ref).classed("unselected", false)
}

function is_mobile() { return (window.innerWidth < 500) }

/**
 * Calculates and excecutes zoom to a given program
 * @param {Object} d Data associated with the program to be zoomed to
 */
function zoom_to(d) {

    var x = this_projection(d.geometry.coordinates)[0],
        y = this_projection(d.geometry.coordinates)[1],
        scale = 5,
        translate = null

    // adjust centering of zoom to compensate for focus box

    if (is_mobile()) {
        translate = [width / 2 - scale * x, (4/5) * height  - scale * y]

    } else {
        if (focus.side == 'R') {
            translate = [width / 4 - scale * x, height / 2 - scale * y];
        } else {
            translate = [ (3/4 * width) - scale * x, height / 2 - scale * y];
        }
    }

    // zoom
    viz.select("#map").transition()
        .duration(zoom_speed)
        .call( zoom.transform, 
            d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) );

    zoom_hint.enter()
}

/**
 * Zoom  function
 */
function zoomed() {

    let transform = d3.event.transform

    viz.select('#map').selectAll('g').attr("transform", transform)

    viz.select("#programs").selectAll("circle")
        .attr("r", dot_size / transform.scale(1).k)

    viz.select("#legend").style("opacity", 0)
    setTimeout(() => { viz.select("#legend").remove(); }, zoom_speed);
}

/**
 * Remove highlight classes, focus, and zoom hint. Zoom to outer scope.
 */
function reset() {

    if (focus !== null) { focus.leave() }
    zoom_hint.leave()

    viz.select("#countries").selectAll("path")
        .classed("selected", false).classed("unselected", false);

    viz.select("#programs").selectAll("circle")
        .classed("unselected", false);

    viz.select("#map").transition()
        .duration(zoom_speed)
        .call( zoom.transform, d3.zoomIdentity );
}


