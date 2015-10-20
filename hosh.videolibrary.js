// JavaScript Document
var gets = 0
var doctorList = ['ansell','berkman','berry','blum','bryan','cech','clyburn','eidman','francis','george','jones','kushwaha','malik','marco','matsu','mcgarvey','metzger','meyer','mims','nelms','parr','parsley','rechter','street','subramanian','weil','winston']

function getVideos(data){
	var totalVids = checkTotal(data);
	var i = 1;
	while(totalVids > 0 ){
		$.getScript("http://gdata.youtube.com/feeds/users/FSHHouston/uploads?alt=json-in-script&callback=createLibrary&max-results=50&start-index="+i)
		totalVids -= 50;
		i += 50;
		gets += 1
	};
}

function checkTotal(data) {
		// Find out how many total videos have been uploaded
		var total = data.feed.openSearch$totalResults.$t;
		// Create an index of retrieved videos
		return total;
}

function createLibrary(data) {
// Takes all the videos from a GET requests, creates HTML code, and adds it to the video library
	var feed = data.feed;
	var entries = feed.entry || [];
	var html = [''];
	for (var i = 0; i < entries.length; i++) {
		var entry = entries[i];
		var title = entry.title.$t;
		var media = entry.media$group;
		var description = media.media$description.$t;
		if (notHOSP(description)){
			var thumbnailUrl = media.media$thumbnail[0].url;
			var videoId = entry.id.$t.substring(38);
			var videoUrl = "http://www.youtube.com/embed/"+videoId+"?rel=0&autoplay=1"
			//The HTML that will be seen for each video
			html.push('<div class="',classifyVideo(title,description,doctorList),'"><a  class="videoLibPop side_links cboxElement" title="',title,'" href=', videoUrl ,'><div')
			
			if(typeof ie !== 'undefined'){
				html.push('><img title="',title,'"src=',thumbnailUrl,' />')
			} else{ 
				html.push(' style="background:url(',thumbnailUrl,') center no-repeat">')
			}
			
			html.push('</div></a><span class="titlec"><a  class="videoLibPop side_links cboxElement" title="',title,'" href=', videoUrl ,'>', title, '</a></span></div>');
		}
	}
	$('#library').append(html.join(''));
	
	gets -= 1	
	if (gets <= 0){
	// If all of the GET requests from Youtube have been added to the HTML, then load Isotope plugin.
		removeDocName(doctorList);
		loadIsotope('*');
	}
}

// Assign a class to each video based on title, and then another class based on the doctor(s) speaking.
function classifyVideo(title, description, DRs){
	var classify = '';
	
	var content = title+' '+description;
	//Add body part filter
	if (content.search(/back pain/i) > -1 || content.search(/spinal/i) > -1){
		classify += 'back-pain ';
	}
	else if (content.search(/hip/i) > -1){
		classify += 'hip ';
	}
	else if (content.search(/knee/i) > -1){
		classify += 'knee ';
	}
	else if (content.search(/shoulder/i) > -1){
		classify += 'shoulder ';
	}
	else {
		classify += 'other '
	}
	
	//Add doctor filter
	var d = description.toLowerCase();
	for (var dr=0;dr < DRs.length; dr++){
		if (d.search(DRs[dr]) >-1){
			classify += DRs[dr]+' ';
		}
	}
	return classify;
}

//Check's video description so it doesn't use videos that are for the hosp website.
function notHOSP(description){
	if (description.search(/HOSP/) > -1){
		return false;
	} 
	else{
		return true;
	}
}

//Remove the <option> for the doctor drop-down menu IFF there are no videos for that doctor.
function removeDocName(DRs){
	for (var d=0; d < DRs.length; d++){
		var docClass = '.'+DRs[d];
		if ($(docClass).length == 0){
			$('#ddm-doctor').find('[value="'+docClass+'"]').remove()
		}
	}
}

function loadIsotope(filterPair){
	$('#library').css('visibility','visible');
	//Map isotope to #library div in source code
	var $container = $('#library');
	// initialize isotope
	$container.isotope({
		filter: filterPair,
		//makes items display in rows of equal height
		layoutMode:'cellsByRow',
		cellsByRow:{
			columnWidth:'245',
			rowHeight:'220'
		},
		//options for transitions
		animationOptions:{
			duration: 550,
			easing: 'linear',
			queue: false
		},
		//options for entire container
		containerStyle:{width:'760px',
		position:'relative',
		overflow:'hidden'
		}			
		
	});
	// filter items when filter link is clicked
	var filters = {};
	$('#filters select').change(function(){
		var selector = $('#ddm-subject').attr('value')+$('#ddm-doctor').attr('value');		
		$container.isotope({ filter: selector });
		noResultsCheck();
		return false;
	})
	// Checks to see if all iso-items are hidden, if so displays "No Results" text
	function noResultsCheck() {
        var noItems = $('<div class="nRC">There are no videos for this selection.</div>');
        var yesItems = $('.nRC');
        var numItems = $('.isotope-item:not(.isotope-hidden)').length;   
        if (numItems == 0) {
            //alert("There are no results");
            $('#library').append(noItems).isotope( 'appended', noItems );
        }
        else
        {
            //alert('There are results');
            $('#library').isotope( 'remove', yesItems);
        }
    }
	
	//Colorbox is initiated here so that options can be applied to video library
	$(".videoLibPop").colorbox({
		width:"700px", 
//		height: "500px",
		innerHeight:'400px', 
		opacity: ".8", 
		iframe:true, 
		scrollbars: "false",
		returnFocus:'false',
		onClosed:function(){libraryReset()}
	});
}

function libraryReset(){
	$('#library').css('display','none')
    // show 'loading' .gif
	 
	//get the current filter and save them
	var wantFilter = $('#ddm-subject').attr('value')+$('#ddm-doctor').attr('value');
	console.log('wanted filter: ' + wantFilter)
	// Reset filter pair to All-All
	loadIsotope('*');
	
	// Set the previous filters
	loadIsotope(wantFilter);
	// remove loading gif
	// show library again
	$('#library').css('display','block')
};
