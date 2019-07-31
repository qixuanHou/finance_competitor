function intNetwork() {
    // get the data

    var ticker = document.getElementById("companyName").value;

    d3.csv("2017.csv", function(error, links) {

        var nodes = {};

        links = links.filter(function(link) {
            return ticker == link.ticker.toLowerCase() || ticker == link.cticker.toLowerCase() || ticker == "";
        })
        console.log(links.length);

        // Compute the distinct nodes from the links.
        links.forEach(function(link) {
            link.source = nodes[link.ticker] || 
                (nodes[link.ticker] = {name: link.source, cik: link.cik, ticker: link.ticker});
            link.target = nodes[link.cticker] || 
                (nodes[link.cticker] = {name: link.target, cik: link.ccik, ticker: link.cticker});
        });
        console.log(nodes);

        var width = 1400,
            height = 600;

        var force = d3.layout.force()
            .nodes(d3.values(nodes))
            .links(links)
            .size([width, height])
            .linkDistance(60)
            .charge(-300)
            .on("tick", tick)
            .start();

        // Set the range
        var  v = d3.scale.linear().range([0, 100]);

        // tooltip
        var tip = d3.tip().attr('class','d3-tip')
            .html(function(d){
                return "<span>" + "Name: " + d.name +  "</span><br><span>" + "Ticker: " + d.ticker + "</span><br><span>" + "CIK: " + d.cik + "</span>";
            });

        // Scale the range of the data
        v.domain([0, d3.max(links, function(d) { return d.value; })]);

        // asign a type per value to encode opacity
        links.forEach(function(link) {
        	link.type = "twofive";
        });

        var svg = d3.select("div.directed").append("svg")
            .attr("width", width)
            .attr("height", height);

        svg.call(tip);

        // build the arrow.
        svg.append("svg:defs").selectAll("marker")
            .data(["end"])      // Different link/path types can be defined here
          .enter().append("svg:marker")    // This section adds in the arrows
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 20)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
          .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");

        // add the links and the arrows
        var path = svg.append("svg:g").selectAll("path")
            .data(force.links())
          .enter().append("svg:path")
            .attr("class", function(d) { return "link " + d.type; })
            .attr("marker-end", "url(#end)");

        // define the nodes
        var node = svg.selectAll(".node")
            .data(force.nodes())
          .enter().append("g")
            .attr("class", "node")
            .on("click", click)
            .on("dblclick", dblclick)
            .call(force.drag);

        // add the nodes
        node.append("circle")
            .attr("r", function(d) {      
                 len = links.filter(function(l) {
                   return l.source.index == d.index || l.target.index == d.index
                 });  
                 d.weight = len.length;    
                 var minRadius = 3;
                 return minRadius + (d.weight/2);
               });

        // add the text 
        node.append("text")
            .attr("x", 12)
            .attr("dy", ".35em")
            .text(function(d) { return d.name; });

        node.on("mouseover",tip.show)
            .on("mouseout",tip.hide)
            .on("dblclick",pin);

        // add the curvy lines
        function tick() {
            path.attr("d", function(d) {
                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy);
                return "M" + 
                    d.source.x + "," + 
                    d.source.y + "A" + 
                    dr + "," + dr + " 0 0,1 " + 
                    d.target.x + "," + 
                    d.target.y;
            });

            node
                .attr("transform", function(d) { 
        		    return "translate(" + d.x + "," + d.y + ")"; });
        }

        // action to take on mouse click
        function click() {
            d3.select(this).select("text").transition()
                .duration(750)
                .attr("x", 22)
                .style("fill", "steelblue")
                .style("stroke", "lightsteelblue")
                .style("stroke-width", ".5px")
                .style("font", "20px sans-serif");
            d3.select(this).select("circle").transition()
                .duration(750)
                .attr("r", 16)
                .style("fill", "lightsteelblue");
        }

        // double click to open sec.gov filings page
        function dblclick(d) {
            var count = 0
            localStorage.clear();
            localStorage.setItem(`${count}`, d.ticker);
            links.forEach(function(link) {
                if (link.source.ticker == d.ticker || link.target.ticker == d.ticker) {
                    count ++
                    localStorage.setItem(`${count}`, link.target.ticker);
                }
            });
            localStorage.setItem("count", count);

            // window.open(`http://www.sec.gov/cgi-bin/browse-edgar?CIK=${d.cik}&action=getcompany`); 
            window.open(`linechart.html`);
        }
    });
}