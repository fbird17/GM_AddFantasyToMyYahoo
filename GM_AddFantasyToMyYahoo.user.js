// ==UserScript==
// @name            GM_AddFantasyToMyYahoo
// @version         0.1.0
// @namespace       https://github.com/fbird17
// @description     Adds Fantasy Baseball and Football links to the My Yahoo! homepage
// @match           *://myyahoo.com
// @match           *://myyahoo.com/*
// @include         *://myyahoo.com
// @include         *://myyahoo.com/*
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_xmlhttpRequest
// @downloadURL     https://raw.githubusercontent.com/fbird17/GM_AddFantasyToMyYahoo/master/GM_AddFantasyToMyYahoo.user.js
// ==/UserScript==

//History
//Version 0.0.5: 3/25/2014: Initial release.
//Version 0.0.6: 3/26/2014: Got rid of Lock button and replaced with mouseup event
//Version 0.0.7: 3/28/2014: Added Firefox support
//Version 0.0.8: 4/02/2014: Got rid of SetURL and just look at leagues directly. More fragile, but more user friendly.
//Version 0.0.9: 4/21/2014: Added Rotisserie league support
//Version 0.1.0: 9/2/2014:  Tested with football. Seems to work. Listed football first. 

// TODO:
// 1. Gave up on integrating a settings button - kept crashing because Yahoo stores functions on its server.
// 2. Make StatTracker launch in separate window (and verify its the same window as from Yahoo Sports)
// 3. Can I update scores automatically?
// 4. Would be nice if the order of football and baseball was configurable (or you could choose which ones you wanted)
//

    var FANTASY_APPLET_GUID = "bf76f7";
    var FANTASY_APPLET_ID = "applet-toolbar_" + FANTASY_APPLET_GUID;

    function debug(msg)
    {
        console.log('GM_AddFantasyToMyYahoo: ' + msg);
    }
   
    function getFirstChildId(parent) 
    {
        var children = parent.children;
        var count = children.length;
        for (var i = 0; i < count; i++) {
              if (children[i].id != "" && children[i].id != FANTASY_APPLET_ID) {
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
    

    debug("My Yahoo - Add FBB Link");
    
    createFantasyDiv();
      
// ----------------------------------------------------------------------------------------------
function createFantasyDiv() 
{
    // This is pretty weak error handling. Basically if anything has changed about the page, we give up and put it back at the top.
    var fantasyParentId = GM_getValue('fantasyParentId', "applet-container-content_p1-c1");
    var fantasyNextSiblingId, firstApplet;
    try {
        firstApplet = getFirstChildId(document.getElementById(fantasyParentId));
        fantasyNextSiblingId = GM_getValue('fantasyNextSiblingId', firstApplet.id);
        debug ("1st try: fantasyNextSiblingId is " + fantasyNextSiblingId + " and fantasyParentId is " + fantasyParentId);
        if (fantasyNextSiblingId != undefined && fantasyNextSiblingId != "undefined" && fantasyNextSiblingId != "") {
            if (document.getElementById(fantasyNextSiblingId).parentElement.id != fantasyParentId) {
                debug ("No parent match - throwing fantasyNextSiblingId");
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
                            '<a href="https://github.com/fbird17/GM_AddFantasyToMyYahoo">About &raquo;</a>' +
                            '</div></div>' +
                            '<div class="App-Chrome_v2">' +
                              '</div>' +
                            '</div>';
        
        // Replace element if it already exists
        var currentElement = document.getElementById(FANTASY_APPLET_ID);
        if (currentElement === null) {
                    
            debug("Position: " + fantasyParentId + " and " + fantasyNextSiblingId);
            var myParent = document.getElementById(fantasyParentId);
            var beforeElement = document.getElementById(fantasyNextSiblingId);
        
            var newNode = document.createElement('div');
            myParent.insertBefore(newNode, beforeElement);
            newNode.outerHTML = '<div id="' + FANTASY_APPLET_ID + '" class=" App_v2  M-0 js-applet myyrss Zoom-1  Mt-20" data-applet-guid="' + FANTASY_APPLET_GUID + '">' +
                '<div class="BrandBar" style="background-color:#6e329d;"><div class="Inner Fl-end"></div></div>' +
                '<div class="App-Hd" data-region="header"><div class="js-applet-view-container-header"><div class="GridSpread">' +
                '<h2 class="Grid-U App-Title"><a href="http://sports.yahoo.com/fantasy/">Yahoo Fantasy Sports</a></h2>' + 
                '</div></div></div>' +  
                '<div id="football"></div><div id="baseball"></div>' +
                FooterHTML + '</div>';      
      
            // Added Event listeners mouseup (to check if our applet has moved)
            document.addEventListener("mouseup", gmSetFantasyPosition, false);
            currentElement = document.getElementById(FANTASY_APPLET_ID);
        }    
        
        getFantasyPageBySport("baseball");
        getFantasyPageBySport("football");
                
        debug("Fantasy div added " + currentElement.id);   

}

function getFantasyPageBySport(sportName)
{
    var sportURL = 'http://' + sportName + '.fantasysports.yahoo.com';               
    GM_xmlhttpRequest({
        method: "GET",
        url: sportURL,
            onerror: function(response) {
               debug ('failed to load ' + sportURL);
            },
            onload: function(response) {
                addSportToElement(response, sportName);
            }
    });  
}

function addSportToElement(response, sportName)
{
    var i;
    debug ('addSportToElement for ' + sportName);
    var baseURL = 'http://' + sportName + '.fantasysports.yahoo.com'; 
        
    var currentElement = document.getElementById(FANTASY_APPLET_ID);
    if (currentElement === null) {
        debug ('addSportToElement could not find id ' + FANTASY_APPLET_ID);
        return;
    }
    var sportDiv = document.getElementById(sportName);
    if (sportDiv === null) {
        debug ('addSportToElement could not find div id ' + sportName);
        return;
    }
        
    var parser = new DOMParser();
    var doc = parser.parseFromString(response.responseText, "text/html");                             
    var scoresElement = doc.getElementById('gamehome-teams');
    if (scoresElement === null) {
        debug ('id gamehome-teams not found for ' + sportName);
        return;
    }
    
    // Head-to-Head
    var leagues = scoresElement.getElementsByTagName('h3');
    var anchors = scoresElement.getElementsByTagName('a');
    var scores = scoresElement.getElementsByClassName('Fz-lg');
    // Ugh, this is very fragile
    // Anchors should be in order: League, Matchup, Team 1, Team 1 img, Team 2 img, Team 2
    // I could only get the scores from the Fz-lg class, whatever that is. Yuck, yuck, yuck.
    if (leagues.length >= 2) {
        for (i = 1; i < leagues.length; i++)
        {
            var leagueName = anchors[(i-1)*6].textContent;
            var leagueURL = baseURL + anchors[(i-1)*6].getAttribute('href');
            var matchupURL = baseURL + anchors[(i-1)*6+1].getAttribute('href');
            var Team1Name = anchors[(i-1)*6+2].textContent;
            var Team1URL = baseURL + anchors[(i-1)*6+2].getAttribute('href');
            var Team2Name = anchors[(i-1)*6+5].textContent;
            var Team2URL = baseURL + anchors[(i-1)*6+5].getAttribute('href');
            var score1 = scores[(i-1)*2].textContent;
            var score2 = scores[(i-1)*2+1].textContent;
            var statTrackerURL  = leagueURL + '/loadstattracker';
            var leagueNumber = leagueURL.slice(leagueURL.lastIndexOf('/')+1);
            var statTrackerTarget = 'stattracker_' + leagueNumber; 
            
            var firstTeam = document.createElement('a');
            firstTeam.setAttribute('href',Team1URL);
            firstTeam.textContent = Team1Name;
            var secondTeam = document.createElement('a');
            secondTeam.setAttribute('href',Team2URL);
            secondTeam.textContent = Team2Name;
            var matchupLink = document.createElement('a');
            matchupLink.setAttribute('href',matchupURL);
            matchupLink.textContent = "View Matchup";
            var statTrackerLink = document.createElement('a');
            statTrackerLink.setAttribute('href',statTrackerURL);
            statTrackerLink.setAttribute('target',statTrackerTarget);
            statTrackerLink.className='Navtarget';
            statTrackerLink.textContent = "Watch Live with StatTracker";
            statTrackerLink.style.fontWeight = 'bold';
            
            var leagueScore = document.createElement('div');
            var leagueTitle = document.createElement('span');
            leagueTitle.className = 'Fw-b';
            leagueTitle.innerHTML = '<a href = "' + leagueURL + '">' + leagueName + '</a>';
            var table = document.createElement('table');
            table.id = leagueName + 'table';
            table.className = 'Bgc-02';
            table.style.width = "100%";
            var tr = table.insertRow(-1);
            tr.insertCell(-1).appendChild( firstTeam );
            tr.insertCell(-1).appendChild( document.createTextNode(score1) );
            tr.cells[1].setAttribute('style', 'text-align:left');
            tr.insertCell(-1).appendChild( matchupLink );
            tr.cells[2].setAttribute('style', 'text-align:right');
            tr = table.insertRow(-1);
            tr.insertCell(-1).appendChild( secondTeam );
            tr.insertCell(-1).appendChild( document.createTextNode(score2) );
            tr.cells[1].setAttribute('style', 'text-align:left');
            tr = table.insertRow(-1);
            tr.insertCell(-1).appendChild( statTrackerLink );   
            
            if (i > 1) {
                leagueScore.appendChild(document.createElement('br'));
            }
            leagueScore.appendChild(leagueTitle);
            leagueScore.appendChild(table);
            sportDiv.appendChild(leagueScore);
        }
    }
    
    // Rotisserie
    var srcTable = null;
    debug ("Looking for Rotisserie");
    var srcTables = scoresElement.getElementsByTagName('table');
    for (i=0; (i < srcTables.length) && (srcTable == null); i++) {
        if (srcTables[i].rows[0].cells[0].textContent == "Teams - Rotisserie") {
            srcTable = srcTables[i];
        }
    }
        
    if (srcTable != null) {
       
        debug ("Found Rotisserie");
        if (leagues.length >= 2) {
            sportDiv.appendChild(document.createElement('br'));   
        }
        
        var leagueScore = document.createElement('div');
        var leagueTitle = document.createElement('span');
        leagueTitle.className = 'Fw-b';
        leagueTitle.innerHTML = 'Rotisserie ' + sportName;
        var rTable = document.createElement('table');
        rTable.id = 'Rotisserie_' + sportName + '_table';
        rTable.style.width = "100%";
        var tr = rTable.insertRow(-1);
        tr.insertCell(-1).appendChild( document.createTextNode('Name') );
        tr.insertCell(-1).appendChild( document.createTextNode('Rank') );
        tr.insertCell(-1).appendChild( document.createTextNode('Points') );
        tr.insertCell(-1).appendChild( document.createTextNode('Pts Back') );
        tr.insertCell(-1);
        tr.cells[2].setAttribute('style', 'text-align:right');
        tr.cells[3].setAttribute('style', 'text-align:right');
        
        var numRows = srcTable.rows.length;
        
        for (i=1; i< numRows; i++) {
            var currRow = srcTable.rows[i];
                
            var teamName = currRow.cells[0].textContent.split(" League: ")[0];
            var leagueName = currRow.cells[0].textContent.split(" League: ")[1];
            var anchors = currRow.cells[0].getElementsByTagName('a');
            var teamURL = baseURL + anchors[0].getAttribute('href');
            var leagueURL = baseURL + anchors[2].getAttribute('href');
            debug("Adding " + teamName);
            
            var rank = currRow.cells[1].textContent;
            var points = currRow.cells[2].textContent;
            var pointDiff = currRow.cells[3].textContent;
            pointDiff = pointDiff.split(" ")[0];
        
            var teamNode = document.createElement('a');
            teamNode.setAttribute('href',teamURL);
            teamNode.textContent = teamName;
            var leagueNode = document.createElement('a');
            leagueNode.setAttribute('href',leagueURL);
            leagueNode.textContent = leagueName;
            var statTrackerURL  = leagueURL + '/loadstattracker';
            var leagueNumber = leagueURL.slice(leagueURL.lastIndexOf('/')+1);
            var statTrackerTarget = 'stattracker_' + leagueNumber; 
            var statTrackerLink = document.createElement('a');
            statTrackerLink.setAttribute('href',statTrackerURL);
            statTrackerLink.setAttribute('target',statTrackerTarget);
            statTrackerLink.className='Navtarget';
            statTrackerLink.textContent = "StatTracker";
            
            var tr = rTable.insertRow(-1);
            tr.className = 'Bgc-02';
            tr.insertCell(-1).appendChild( teamNode );
            tr.insertCell(-1).appendChild( document.createTextNode(rank) );
            tr.insertCell(-1).appendChild( document.createTextNode(points) );
            tr.insertCell(-1).appendChild( document.createTextNode(pointDiff) );
            tr.insertCell(-1).appendChild( statTrackerLink );
            tr.cells[2].setAttribute('style', 'text-align:right');
            tr.cells[3].setAttribute('style', 'text-align:right');
            tr.cells[4].setAttribute('style', 'text-align:right');
            tr = rTable.insertRow(-1);
            tr.className = 'Bgc-02';
            tr.insertCell(-1).appendChild( leagueNode );
            tr.insertCell(-1);
            tr.insertCell(-1);
            tr.insertCell(-1);
            tr.insertCell(-1);
        }
        leagueScore.appendChild(leagueTitle);
        leagueScore.appendChild(rTable);
        sportDiv.appendChild(leagueScore);
    }
    
}

