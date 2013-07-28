$(function() {

	//Width and height of the map
	var w = 650;
	var h = 500;
	
	var yearsArr = [2009, 2010, 2011, 2012];
	var minYear = parseInt(yearsArr[0]);
	var maxYear = parseInt(yearsArr[yearsArr.length - 1]);
	var selectedYear = minYear;
	var previousYear;
	
	var radiusCircle = 0.0004;

	//Define map projection
	var projection = d3.geo.mercator()
		.translate([240, 825])  // positoning of the map
		.scale([3300]);			// scaling of the map

	//Define path generator
	var path = d3.geo.path().projection(projection);

	//Create SVG element
	var svg = d3.select(".right_layout").append("svg").attr("width", w).attr("height", h);

	var EuropeanaObject;
	var europeanaTotal = 0;

	d3.csv("data/EuropeanaCountries_2.csv", function(data) {

		//Load in GeoJSON data
		d3.json("data/world-countriesEuropeana.json", function(json) {

			//Merge the ag. data and GeoJSON
			//Loop through once for each ag. data value
			for (var i = 0; i < data.length; i++) {

				if (i == 0) {
					EuropeanaObject = data[i];
					setDefault();
				}
				//Grab state name
				var dataState = data[i].id;

				//Grab data value, and convert from string to float
				var dataValue = parseFloat(data[i].value);

				//Find the corresponding state inside the GeoJSON
				for (var j = 0; j < json.features.length; j++) {

					var jsonState = json.features[j].properties.ISO2;

					if (dataState == jsonState) {
						//Copy the data value into the JSON
						json.features[j].value = 1;
						json.features[j].Europeana = data[i];

						break; //Stop looking through the JSON
					}
				}

			}

			d3.csv("data/EuropeanaCountries_2.csv", function(data) {

				svg.selectAll("circle").data(data).enter().append("circle").attr("cx", function(d) {
					return projection([d.Long, d.Lat])[0];
				}).attr("cy", function(d) {
					return projection([d.Long, d.Lat])[1];
				}).attr("r", function(d) {
					return getRadiusCircle(d);
				}).attr("class", function(d) {
					return "circle";
				}).style("opacity", 0.6)
				.on("click", function(d) {

					if (d3.select(this).classed("onSelectedBubble")) {//this probably could be done smarter
						d3.select(this).classed("onSelectedBubble", false);
						d3.select(this).classed("circle", true);
						setDefault();
					} else {
						d3.select(".onSelectedBubble").attr("class", "circle");
						d3.select(this).attr("class", "onSelectedBubble");
						var arr = [d.year2009, d.year2010, d.year2011, d.year2012];
						updateBarChart(arr, d.CountryName);
						d3.select("#clickBarchart").text("Click the circle for more details");
					}
				}).on ("mouseover", function(d) {

					// set hovered element on top
					svg.selectAll("circle").sort(function(a, b) {// select the parent and sort the path's
						if (a.id != d.id)
							return -1;
						// a it's not the hovered element, send "a" to the back
						else
							return 1;
						// a it's the hovered element, bring "a" to the front
					});

					var offsetClass = $('.right_layout').offset();

					var x_posClass = offsetClass.left;
					var y_poClass = offsetClass.top;

					//Update the tooltip position and value
					d3.select("#tooltip").select("#title").text(d.CountryName);
					
					var innerWidth =  $('#tooltip').innerWidth();
					var innerHeight = $('#tooltip').innerHeight();
					var xPosition = parseFloat(d3.select(this).attr("cx") + d3.select(this).attr("r")/2 ) + x_posClass - (innerWidth/2);
					var yPosition = parseFloat(d3.select(this).attr("cy") - d3.select(this).attr("r")) + y_poClass - innerHeight - 10;
					
					d3.select("#tooltip")
						.style("left", xPosition + "px")
						.style("top", yPosition + "px");
					
					var numberCountry = correctYear(d);
					var num = getFormattedNumber (numberCountry);

					var numberEuropeana = correctYear(EuropeanaObject);
					var percentage = (numberCountry / numberEuropeana );					
					
					var formatPercent = d3.format(".1%");
					percentage = formatPercent(percentage);

					d3.select("#tooltip").select("#value").text(num);
					d3.select("#year").text(selectedYear);
					d3.select("#year2").text(selectedYear);
					d3.select("#percentage").text(percentage);

					//Show the tooltip
					d3.select("#tooltip").classed("hidden", false);
				}).on("mouseout", function() {
					//Hide the tooltip
					d3.select("#tooltip").classed("hidden", true);
				});
			});

			//Bind data and create one path per GeoJSON feature
			svg.selectAll("path").data(json.features).enter().append("path").attr("d", path).attr("class", function(d) {
				var EU = d.Europeana || false;
				if (EU != false) {
					var value = d.Europeana.Type;
					if (value == 1) {
						//If value exists…
						return 'EU';
					} else if (value == 2) {
						return 'nonEu';
					}
				} else {
					//If value is undefined…
					return "nonParticipant";
				}
			});

		});

	});

	function getRadiusCircle(d) {
		var amount = correctYear(d);
				
		if (correctYear(d) == "NaN")
			{
				amount = d['year' + previousYear];
			} 
						
		return Math.sqrt(parseInt(amount) * radiusCircle);
	}
	
	function getFormattedNumber (d) {
		var formatNumber = d3.format(".3s");
		return formatNumber(d);
	}
					

	function updateMap() {
		//Update all bubbles
		svg.selectAll("circle").transition().duration(500).ease("linear").attr("r", function(d) {
			return getRadiusCircle (d);
		});
		
		svg.selectAll("circle")
			.classed('IsNaN', function(d) {
			if ( d['year' + selectedYear] == "NaN" ){
				return true;
			} else {
				return false;
			}
		});

		
	};

	function updateAnnotation() {		
		var index = yearsArr.indexOf (selectedYear);
		d3.select("#annotation").text(annotationText[index]);
	}

	function correctYear(d) {
		return d['year' + selectedYear];
	}

/* START SLIDER */

	$("#slider").slider({
		value : selectedYear,
		min : minYear,
		max : maxYear,
		step : 1,
		slide : function(event, ui) {
			onSliderUpdate(ui.value);
		}
	});

	function onSliderUpdate(year) {
		previousYear = selectedYear; // get Previous Year
		selectedYear = year;
		updateMap();
		updateAnnotation();
		$("#year").val(year);
		updateLabel(year);
		checkNextPrevious();

	}

	setSliderTicks();	// set ticks and labels for timeline
	updateLabel(selectedYear);	// creates bold text for label selected
	checkNextPrevious();	//check if next and previous button are active

	$('#next').click(function(evt) {
		if (nextBool) {
			var plusOne = selectedYear + 1;

			$("#slider").slider('value', plusOne);
			onSliderUpdate(plusOne);
		}
		evt.preventDefault();
	});

	$('#previous').click(function(evt) {
		if (prevBool) {
			var minusOne = selectedYear - 1;

			$("#slider").slider('value', minusOne);
			onSliderUpdate(minusOne);
		}
		evt.preventDefault();
	});

	var prevBool;
	var nextBool;

	function checkNextPrevious() {
		var sliderWidget = $("#slider");
		var getMax = sliderWidget.slider('option', 'max');
		var getMin = sliderWidget.slider('option', 'min');

		$("#slideryear").text(String(selectedYear));

		if (selectedYear >= getMax) {
			$('#next').removeClass('active');
			nextBool = false;
		} else if (!nextBool) {
			$('#next').addClass("active");
			nextBool = true;
		}

		if (selectedYear == getMin) {
			$('#previous').removeClass('active');
			prevBool = false;
		} else if (!prevBool) {
			$('#previous').addClass("active");
			prevBool = true;
		}

	}

	function setSliderTicks() {
		var $slider = $('#slider');
		var max = $slider.slider("option", "max");
		var min = $slider.slider("option", "min");
		var spacing = $slider.width() / (max - min) - 1;

		$slider.find('.ui-slider-tick-mark').remove();
		for (var i = 0; i < max - min + 1; i++) {
			$('<span class="ui-slider-tick-mark"></span>').css('left', (spacing * i) + 'px').appendTo($slider);
			$('<span class="ui-slider-tick-label ' + (min + i) + '"></span>').append(min + i).css('left', (spacing * i - 15) + 'px').appendTo($slider);
		}
	}

	function updateLabel(year) {
		$('.selectedYear').removeClass("selectedYear");
		$('.ui-slider-tick-label').filter('.' + year).addClass("selectedYear");
	}
	
	/* END SLIDER */

	/* START ANNOTATION */
	var annotationText;
	setupAnnotation();

	function setupAnnotation() {
		$.get('data/annotation.txt', function(data) {
			annotationText = data.split('\n');
			updateAnnotation();
		});
	}

	/* BARCHART START */

	var dataset = [0, 0, 34, 421];

	var marginChart = {
		"top" : 10,
		"right" : 10,
		"bottom" : 30,
		"left" : 50
	}, chartWidth = 180, chartHeight = 110, paddingChart = 5;

	var formatNumber = d3.format(".3s");

	var xBar = d3.scale.ordinal().domain(yearsArr.map(function(d) {
		return d;
	})).rangeRoundBands([0, chartWidth], 0);

	var yBar = d3.scale.linear().range([chartHeight, 0]);

	var xAxis = d3.svg.axis().scale(xBar).orient("middle");
	
	var yAxis = d3.svg.axis()
					.scale(yBar)
					.ticks(5)
					.tickSize(chartWidth)
					.tickFormat(formatNumber)
					.orient("right");

	var chartContainer = d3.select("#barChart")
						.append("svg")
						.attr("class", "chart")
						.attr("width", chartWidth + marginChart.left + marginChart.right - paddingChart)
						.attr("height", chartHeight + marginChart.top + marginChart.bottom)
						.append("g")
						.attr("transform", "translate(" + marginChart.left + "," + marginChart.right + ")");
	

		
	drawBarChart(dataset);

	function drawBarChart (dataset) {

		yBar.domain([0, d3.max(dataset)]);
		
			
		chartContainer.selectAll(".bar").data(dataset).enter()
			.append("rect")
			.style("opacity", function(d) {
				var randomNum = Math.random() * .2 + .6;
				return randomNum;})
			.on("mouseover", function(d, i) {
				console.log(d);
			})
		   .attr({
		   		class: "bar",
                x: function(d, i) { return i * xBar.rangeBand() + paddingChart; },
                y: function(d) { return yBar(d); },
                width: xBar.rangeBand() - paddingChart,
                height: function(d) { return chartHeight - yBar(d); }
  			 });
  			 
		chartContainer.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate( 0," + chartHeight + ")")
			.call(xAxis);
			
		chartContainer.append("g")
			.attr("class", "y axis")
			.call(yAxis)
			.call(customAxis2);
  			 
	}
	
		function customAxis2(g) {
		  g.selectAll(".y.axis text")
		      .attr("x", -10)
		      .attr("dy", 4)
		     .style("text-anchor", "end");

		}	

	function setDefault() {
		var arr = [EuropeanaObject.year2009, EuropeanaObject.year2010, EuropeanaObject.year2011, EuropeanaObject.year2012];
		europeanaTotal = EuropeanaObject.year2012;		
		updateBarChart(arr, "Europeana");
		
		d3.select("#clickBarchart").text("Click the circle for more details");		// set label text to more details
	}

	function updateBarChart(arr, countryName) {

		d3.select("#barChartWrapper")	// set header to countryname
		.select("h2")
		.text(countryName);
				
		// convert to numbers
		var dataset2 = arr.map(function(x) {
			if (x == "NaN") {
				return parseInt (0, 10);
			} else {
				return parseInt(x, 10);
			}
		});
		
		updateBarChartText (dataset2, countryName);
				
		yBar.domain([0, d3.max(dataset2)]);

		//Update all rects
		chartContainer.selectAll("rect").data(dataset2).transition().duration(750).attr("y", function(d) {
			return yBar(d);
		}).attr("height", function(d) {
			return chartHeight - yBar(d);
		});

					
		chartContainer
			.transition()
			.duration(750)
			.select(".y.axis")
			.call(yAxis)
    		.selectAll("text") // cancel transition on customized attributes
      		.tween("attr.x", null)
      		.tween("attr.dy", null);
      		
      		chartContainer.call(customAxis2);
	};
	
	function updateBarChartText (dataset2, countryName) {
				
		var totalCountry = getTotalAmount (dataset2);
		var formatNum = getFormattedNumber (totalCountry);
		
		var percentage = (totalCountry / europeanaTotal);
		var formatPercent = d3.format(".1%");
		var formatNumPerc =  formatPercent (percentage);
		
		if (countryName == "Europeana") {
			var start = countryName + " received in " + yearsArr.length + " years, ";
			var endLine1 = " objects for the collection.";
			var endLine2 = "";
		} else {			
			var start = countryName + " contributed in " + yearsArr.length + " years, ";
			var endLine1 = " objects to Europeana. Which is ";
			var endLine2 = " of the total Europeana contributions.";
		}
		
		d3.select("#chartInformation").text(start);
		d3.select("#chartInformation").append("h3").html(formatNum);		
		d3.select("#chartInformation").append("span").html(endLine1);
		
		if (countryName != "Europeana") {
			d3.select("#chartInformation").append("h3").html(formatNumPerc);
			d3.select("#chartInformation").append("span").html(endLine2);
		}
	}
	
	function getTotalAmount(arr) {

		return arr [arr.length - 1];
	}

}); // end ready function