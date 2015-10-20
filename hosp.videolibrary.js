/*/
/ Set up video library on HOSP site by only looking for a specific list of doctors./ 
/*/

// global index of the number of video "chunks" that have been downloaded
var gets = 0

// This is the list of doctors that will be in the video library.
var doctorHOSP = ['ansell','blum','christensen','hadnott','lee','parsley','randall','street']

function getVideos(data){
	/// A loop that pulls youtube video data for all videos in FSHHouston channel in chunks of 50 (the max youtube allows) videos.
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
	/// Find out how many total videos are on youtube Channel.
	var total = data.feed.openSearch$totalResults.$t;
	return total;
}

function createLibrary(data) {
/// Takes all the videos from a GET requests, creates HTML code, and adds it to the video library
	var feed = data.feed;
	var entries = feed.entry || [];
	var html = [''];
	for (var i = 0; i < entries.length; i++) {
		var entry = entries[i];
		var title = entry.title.$t;
		var media = entry.media$group;
		var description = media.media$description.$t;
		if (onlyShowDoc(doctorHOSP,description)){			
			var thumbnailUrl = media.media$thumbnail[0].url;
			var videoId = entry.id.$t.substring(38);
			var videoUrl = "http://www.youtube.com/embed/"+videoId+"?rel=0&autoplay=1"
			//The HTML that will be seen for each video
			html.push('<div class="',classifyVideo(title,description,doctorHOSP),' iso"><a  class="videoLibPop side_links cboxElement" title="',title,'" href=', videoUrl ,'><div')
			
			if(typeof ie !== 'undefined'){
				html.push('><img alt="',title,'"src=',thumbnailUrl,' />')
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
		removeDocName(doctorHOSP);
		loadIsotope('*');
		var noItems = $('<div class="nRC">There are no videos for this selection.</div>');
	    $('#library').append(noItems).isotope( 'appended', noItems );
		$('.nRC').css('display','none');
	}
}

function onlyShowDoc(docList, vid_description){
/// Compares the video description to a list of doctors and reports true when the video is about a doctor on the list.
	var d = vid_description.toLowerCase();
	for (var i=0;i<docList.length;i++){
		if (d.search(docList[i]) >-1){
			return true;
		}
	}
}

function classifyVideo(title, description, DRs){
/// Assign a class to each video based on title+description, and then another class based on the doctor(s) speaking.
	var classify = '';
	
	var content = title+' '+description;
	//Add body part filter
	if (content.search(/back pain/i) > -1){
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

function removeDocName(DRs){
///Remove the <option> for the doctor drop-down menu IFF there are no videos for that doctor.	
	for (var d=0; d < DRs.length; d++){
		var docClass = '.'+DRs[d];
		if ($(docClass).length == 0){
			$('#ddm-doctor').find('[value="'+docClass+'"]').remove()
		}
	}
}

function loadIsotope(filterPair){
///Creates Isotope instance and sets the options needed. Also defines action on filter change.	
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
		containerStyle:{width:'740px',
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
	}).one('change', function(){$('.nRC').css('display','inline-block');})
	
	function noResultsCheck() {
	/// Checks to see if all iso-items are hidden, if so displays "No Results" text. 
        var numItems = $('.isotope-item:not(.isotope-hidden)').length;  
		if (numItems==0){
			$('#library').isotope({ filter: ".nRC" });
		}
		
    }
	
	//Colorbox is initiated here so that options can be applied to video library. Colorbox fails otherwise.
	$(".videoLibPop").colorbox({
		width:"700px",
		innerHeight:'400px', 
		opacity: ".8", 
		iframe:true, 
		scrollbars: "false",
		returnFocus:'false',
		onClosed:function(){libraryReset()}
	});
}

function libraryReset(){
///This is a Reset for isotope as a fix for videos hiding behind overflow after colorbox exits.		
	$('#library').css('display','none')
	
	var wantFilter = $('#ddm-subject').attr('value')+$('#ddm-doctor').attr('value');//get the current filter and save them
	
	loadIsotope('*');// Reset filter pair to All-All
	
	loadIsotope(wantFilter);// Set the previous filters
	
	$('#library').css('display','block')// show library again
};
