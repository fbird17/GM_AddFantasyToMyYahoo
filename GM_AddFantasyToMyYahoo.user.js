// ==UserScript==
// @name				GM_AddFantasyToMyYahoo
// @version				0.0.4
// @namespace			https://github.com/fbird17
// @description			Adds a Fantasy Baseball (and probably Football) link to the My Yahoo! homepage
// @match      			https://my.yahoo.com*
// @include    			https://my.yahoo.com*
// @grant       		GM_getValue
// @grant				GM_setValue
// @grant				GM_xmlhttpRequest
// @downloadURL     	https://raw.githubusercontent.com/fbird17/GM_AddFantasyToMyYahoo/master/GM_AddFantasyToMyYahoo.user.js
// ==/UserScript==

//History
//Version 0.0.2:  3/25/2014:  Initial release.
   
// TODO:
// 1. Gave up on integrating a settings button - kept crashing because Yahoo stores functions on its server.
// 2. Caveat: Only supports one fantasy team at a time, and only one instance is allowed (sorry). Could add a '+' button
//    for this and make an array of added elements.
// 3. Would prefer to lock automatically instead of with button, but can't figure out what event to grab to do it, so I'm 
//    stuck with that ridiculous LockButton (considered using a timer event, but why hose performance for a rare event)

	var FANTASY_APPLET_GUID = "bf76f7";
	var FANTASY_APPLET_ID = "applet-toolbar_" + FANTASY_APPLET_GUID;

	function debug(msg)
	{
    	console.log(msg);
    }

	function gmSetFantasyURLValue() 
	{
        var val = document.getElementById("fantasyURLInput").value;
        
        debug("Setting value " + val);
        fakeTimeout(function() { GM_setValue('fantasyURL', val); });
        debug ("Value is now " + GM_getValue('fantasyURL'));
        
        GetFantasyPage();
	}
    
    function getFirstChildId(parent) 
    {
        var children = parent.children;
		var count = children.length;
		for (var i = 0; i < count; i++) {
  			if (children[i].id != "") {
    			break;
  			}
        }
        debug("getFirstChildId: " + i + " (" + children[i].id + ")");
		return children[i];
    }

	function gmSetFantasyPosition()
	{
        var fantasyParentId = document.getElementById(FANTASY_APPLET_ID).parentNode.id;
        var fantasyNextSibling = document.getElementById(FANTASY_APPLET_ID).nextSibling;
        while (fantasyNextSibling != undefined) {
            if (fantasyNextSibling.id != undefined && fantasyNextSibling.id != "") {
                break;
            }
            fantasyNextSibling = fantasyNextSibling.nextSibling;
        }
        var fantasyNextSiblingId = undefined;
        if (fantasyNextSibling != undefined) {
            fantasyNextSiblingId = fantasyNextSibling.id;
        }
            
        debug("Setting value " + fantasyParentId + " and " + fantasyNextSiblingId);
        fakeTimeout(function() { GM_setValue('fantasyParentId', fantasyParentId); });
        fakeTimeout(function() { GM_setValue('fantasyNextSiblingId', fantasyNextSiblingId); });
        debug ("Value is now " + GM_getValue('fantasyParentId') + " and " + GM_getValue('fantasyNextSiblingId'));   
	}

	function setRecursiveCallback(element, eventName, callback) 
	{
        var i;
        element.addEventListener(eventName, callback, false);
        debug("Adding event " + eventName + " for " + element.tagName);
        for (i=0; i<element.children.length; i++) {
        	setRecursiveCallback(element.children[i], eventName, callback);
        }
    }

    function fakeTimeout(callback) {
  		// Register event listener
 		 window.document.body.addEventListener("timeoutEvent", callback, false);
  		// Generate and dispatch synthetic event
  		var ev = document.createEvent("HTMLEvents");
  		ev.initEvent("timeoutEvent", true, false);
  		window.document.body.dispatchEvent(ev);
	}
    
	function GetFantasyPage() {
		var fantasyURL = GM_getValue('fantasyURL');
   		       
   		GM_xmlhttpRequest({
       		method: "GET",
       		url: fantasyURL,
       		onerror: function(response) {
           		createFBBBox(response, false, fantasyURL);
       		},
       		onload: function(response) {
           		createFBBBox(response, true, fantasyURL);
       		}
        });
    }
	//Function.prototype.bind = function( thisObject ) {
  	//	var method = this;
  	//	var oldargs = [].slice.call( arguments, 1 );
  	//	return function () {
    //		var newargs = [].slice.call( arguments );
    //		return method.apply( thisObject, oldargs.concat( newargs ));
  	//	};
	//}

    function createFBBBox(response, validURL, fantasyURL)
	{ 
        var table, title;
        
        if (validURL) {
    		var parser = new DOMParser();
        	var doc = parser.parseFromString(response.responseText, "text/html");            
                        
            var baseURL = fantasyURL.substr(0, fantasyURL.search(/[^\/]\/(?!\/)/)+1);
            
           // here we go
           title = doc.title;
           title = title.split('- ')[1];
           
           var MatchupList = doc.getElementById('scoreboard-fantasy').getElementsByClassName('yfa-matchup')[0];       
           var anchors = MatchupList.getElementsByTagName('a');
           var firstTeam = document.createElement('a');
           firstTeam.setAttribute('href',baseURL + anchors[0].getAttribute('href'));
           firstTeam.innerText = anchors[0].innerText;
           var firstTeamScore = MatchupList.getElementsByTagName('span')[0].innerText;
           var secondTeam = document.createElement('a');
           secondTeam.setAttribute('href',baseURL + anchors[1].getAttribute('href'));
           secondTeam.innerText = anchors[1].innerText;
           var secondTeamScore = MatchupList.getElementsByTagName('span')[1].innerText;
           
           var matchupLink = document.createElement('span');
           matchupLink.innerText = "Match Up link not available";
           var statTrackerLink = document.createElement('span');
           statTrackerLink.innerText = "StatTracker not available";
            
           for (var i = 0; i < anchors.length; i++) {
                if (anchors[i].innerText === "Match Up") { 
                    matchupLink = document.createElement('a');
           			matchupLink.setAttribute('href',baseURL + anchors[2].getAttribute('href'));
           			matchupLink.innerText = anchors[2].innerText;
                } else if (anchors[i].innerText.search("StatTracker") > -1) {
                    statTrackerLink = document.createElement('a');
                    statTrackerLink.setAttribute('href',baseURL + anchors[3].getAttribute('href'));
           			statTrackerLink.innerText = anchors[3].innerText;
           			statTrackerLink.style.fontWeight = 'bold';
                }
           }
           
           table = document.createElement('table');
           table.id = 'MyYahooFantasyTableId';
    	   var tr = document.createElement('tr');
           tr.appendChild( document.createElement('td') );
    	   tr.appendChild( document.createElement('td') );
           tr.appendChild( document.createElement('td') );
           tr.cells[0].appendChild( firstTeam );
           tr.cells[1].appendChild( document.createTextNode(firstTeamScore) );
           tr.cells[2].appendChild( matchupLink );
           tr.cells[2].setAttribute('align', 'right');
           tr.cells[2].setAttribute('width', '60px');
           table.appendChild(tr);
           tr = document.createElement('tr');
           tr.appendChild( document.createElement('td') );
    	   tr.appendChild( document.createElement('td') );
           tr.cells[0].appendChild( secondTeam );
           tr.cells[1].appendChild( document.createTextNode(secondTeamScore) );
		   table.appendChild(tr);
           tr = document.createElement('tr');
           tr.appendChild( document.createElement('td') );
    	   tr.cells[0].appendChild( statTrackerLink );
		   table.appendChild(tr);
        }
        else {
         	title = "MyYahoo - Add FBB Link";
            table = document.createElement('table');
        }
        debug(table.outerHTML);
            
        // This is pretty weak error handling. Basically if anything has changed about the page, we give up and put it back at the top.
        var fantasyParentId = GM_getValue('fantasyParentId', "applet-container-content_p1-c1");
        var fantasyNextSiblingId, firstApplet;
        try {
        	firstApplet = getFirstChildId(document.getElementById(fantasyParentId));
            fantasyNextSiblingId = GM_getValue('fantasyNextSiblingId', firstApplet.id);
            debug ("1st try: fantasyNextSiblingId is " + fantasyNextSiblingId + " and fantasyParentId is " + fantasyParentId);
            if (fantasyNextSiblingId != undefined && fantasyNextSiblingId != "undefined" && fantasyNextSiblingId != "") {
                if (document.getElementById(fantasyNextSiblingId).parentElement.id != fantasyParentId) {
                    debug ("No parent match - throwing fantasyNextSiblingIdiblingId");
                    throw ("BeforeElement and Parent don't match. Giving up and resetting.");
                }
            }
        } catch(e) {
            fantasyParentId = "applet-container-content_p1-c1";
            firstApplet = getFirstChildId(document.getElementById(fantasyParentId));
            fantasyNextSiblingId = firstApplet.id;
        }
        debug ("final try: fantasyNextSiblingId is " + fantasyNextSiblingId + " and fantasyParentId is " + fantasyParentId);
        
        // I considered cloning firstApplet for this, but there were a few problems with that:
        // 1. What if firstApplet is weird?
        // 2. I would need to pull out a bunch of specific div's, like the settings button, so it didn't really buy me much in terms of abstracting the current HTML
        var FooterHTML = '<div class="App-Ft Row"><div data-region="footer" class="Fl-start Pos-r Z-1"><div class="js-applet-view-container-footer">' + 
                			'<FORM id="fantasyURLForm">' + 
        					'<INPUT id="fantasyURLInput" TYPE="TEXT" size="45">' +
                            '<button id="fantasyURLbtn" TYPE="Button">Set URL</button> ' +
            				'<button id="setPositionbtn" TYPE="Button">Lock</button> ' +
            				'</FORM>' +
            				'</div></div>' +
                            '<div class="App-Chrome_v2">' +
          	            	'</div>' +
        					'</div>';
        
        // Remove it if it already exists
        var currentElement = document.getElementById(FANTASY_APPLET_ID);
        if (currentElement) {
           	currentElement.parentNode.removeChild(currentElement);
        } 
        
        debug("Position: " + fantasyParentId + " and " + fantasyNextSiblingId);
        var myParent = document.getElementById(fantasyParentId);
        var beforeElement = document.getElementById(fantasyNextSiblingId);
        
		var newNode = document.createElement('div');
        myParent.insertBefore(newNode, beforeElement);
        newNode.outerHTML = '<div id="' + FANTASY_APPLET_ID + '" class=" App_v2  M-0 js-applet myyrss Zoom-1  Mt-20" data-applet-guid="' + FANTASY_APPLET_GUID + '">' +
            	'<div class="BrandBar" style="background-color:#6e329d;"><div class="Inner Fl-end"></div></div>' +
            	'<div class="App-Hd" data-region="header"><div class="js-applet-view-container-header"><div class="GridSpread">' +
            	'<h2 class="Grid-U App-Title"><a href="' + fantasyURL + '">' + title + '</a></h2>' + 
                '</div></div></div>' + table.outerHTML + FooterHTML + '</div>';      
      
  		// Added Event listerners for SetURL and Lock buttons. Of course, the lock button should be unnecessary (sigh)
		var setURLbtn=document.getElementById("fantasyURLbtn");
       	setURLbtn.addEventListener("click", gmSetFantasyURLValue, false);
        var setPositionBtn=document.getElementById("setPositionbtn");
        setPositionBtn.addEventListener("click", gmSetFantasyPosition, false);
        currentElement = document.getElementById(FANTASY_APPLET_ID);
        //currentElement.addEventListener("mouseup", gmSetFantasyPosition, false);
        //setRecursiveCallback(currentElement, "focusout", gmSetFantasyPosition);
        //setRecursiveCallback(currentElement, "drop", gmSetFantasyPosition);
                
        document.getElementById("fantasyURLInput").defaultValue = fantasyURL;
        debug("Fantasy added " + currentElement.id + " as " + fantasyURL);
	}

	debug("My Yahoo - Add FBB Link");
   	GetFantasyPage();
  
// ----------------------------------------------------------------------------------------------