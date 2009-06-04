/***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ubiquity.
 *
 * The Initial Developer of the Original Code is Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Michael Yoshitaka Erlewine <mitcho@mitcho.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

Components.utils.import("resource://ubiquity/modules/utils.js");
Components.utils.import("resource://ubiquity/modules/setup.js");

// set up the interface which will control the parser.

var Cc = Components.classes;
var Ci = Components.interfaces;

var demoParserInterface = {
  startTime: 0,
  endTime: 0,
  runtimes: 0,
  currentLang: UbiquitySetup.languageCode,
  currentParser: null,
  currentQuery: {},
  parse: function() {
    if (this.currentQuery.cancel != undefined)
      if (!this.currentQuery.finished)
        this.currentQuery.cancel();

    $('#parseinfo').empty();
    this.currentQuery = this.currentParser.newQuery($('.input').val(),{},$('#maxSuggestions').val(),true); // this last true is for dontRunImmediately
    
    // custom flag to make sure we don't onResults multiple times per query.
    this.currentQuery.resulted = false;
    
    // override the selection object
    this.currentQuery.selObj = {text: $('#selection').val(), 
                                html: $('#selection').val()};
    
    $('#scoredParses').empty();

    this.currentQuery.watch('_step',function(id,oldval,newval) {
      let timefactor = 4;
      if (oldval > 0)
        //$('#timeinfo div').eq(oldval-1).css('width',(this._times[oldval] - this._times[oldval-1]) * timefactor);

      if ($('#displayparseinfo').attr('checked')) {
        switch (oldval) {
          case 1:
            $('<h3>step 1: split words</h3><code>'+this._input+'</code>').appendTo($('#parseinfo'));
            break;

          case 2:
            $('<h3>step 2: pick possible verbs</h3><ul id="verbArgPairs"></ul>').appendTo($('#parseinfo'));
            for each (pair in this._verbArgPairs) {
              $('<li>V: <code title="'+(pair._verb.id || 'null')+'">'+(pair._verb.text || '<i>null</i>')+'</code>, argString: <code>'+pair.argString+'</code></li>').appendTo($('#verbArgPairs'));
            }
            break;
        
          case 3:
            $('<h3>step 3: pick possible clitics (TODO)</h3>').appendTo($('#parseinfo'));
            break;

          case 4: 
            $('<h3>step 4: group into arguments</h3><ul id="argParses"></ul>').appendTo($('#parseinfo'));
            for each (var parse in this._possibleParses) {
              $('<li>'+parse.getDisplayText()+'</li>').appendTo($('#argParses'));
            }
            $('<p><small>'+this._possibleParses.length+' possible parses</small></p>').appendTo($('#parseinfo'));
            break;

          case 5:
            $('<h3>step 5: anaphora substitution</h3><ul id="newPossibleParses"></ul>').appendTo($('#parseinfo'));
            for each (var parse in this._possibleParses) {
              $('<li>'+parse.getDisplayText()+'</li>').appendTo($('#newPossibleParses'));
            }
            $('<p><small>'+this._possibleParses.length+' possible parses</small></p>').appendTo($('#parseinfo'));
            break;
          
          case 6:
            $('<h3>step 6: substitute normalized arguments</h3><ul id="normalizedArgParses"></ul>').appendTo($('#parseinfo'));
            for each (var parse in this._possibleParses) {
              $('<li>'+parse.getDisplayText(true)+'</li>').appendTo($('#normalizedArgParses'));
            }
            $('<p><small>'+this._possibleParses.length+' possible parses</small></p>').appendTo($('#parseinfo'));
            break;
          
          case 7:
            $('<h3>step 6: suggest verbs</h3><ul id="verbedParses"></ul>').appendTo($('#parseinfo'));
            for each (var parse in this._verbedParses) {
              $('<li>'+parse.getDisplayText(true)+'</li>').appendTo($('#verbedParses'));
            }
            $('<p><small>'+this._verbedParses.length+' parses with verbs</small></p>').appendTo($('#parseinfo'));
            break;

          case 8:
          case 9:
          case 10:
            /*$('<h3>step 7: noun type detection</h3><ul id="nounCache"></ul>').appendTo($('#parseinfo'));
            for (var text in nounCache) {
              var html = $('<li><code>'+text+'</code></li>');
              var list = $('<ul></ul>');
              for each (let suggestion in nounCache[text]) {
                $('<li>type: <code>'+suggestion.nountype.name+'</code>, suggestion: '+suggestion.text+', score: '+suggestion.score+'</li>').appendTo(list);
              }
              list.appendTo(html);
              html.appendTo($('#nounCache'));
            }*/


            $('<h3>step 8: fill in noun suggestions</h3><ul id="suggestedParses"></ul>').appendTo($('#parseinfo'));
            for each (let parse in this._suggestedParses) {
              $('<li>'+parse.getDisplayText(true)+'</li>').appendTo($('#suggestedParses'));
            }
            $('<p><small>'+this._suggestedParses.length+' parses with noun suggestions swapped in</small></p>').appendTo($('#parseinfo'));


            $('<h3>step 9: ranking</h3><ul id="debugScoredParses"></ul>').appendTo($('#parseinfo'));
            for each (let parse in this._scoredParses) {
              $('<li>'+parse.getDisplayText(true)+'</li>').appendTo($('#debugScoredParses'));
            }
            $('<p><small>'+this._scoredParses.length+' scored parses</small></p>').appendTo($('#parseinfo'));
            break;

        }
      }
      
      return newval;
    });
    
    this.currentQuery.onResults = function() {
      if (this.finished && !this.resulted) {
        this.resulted = true;
        demoParserInterface.runtimes++;
        $('.current').text(demoParserInterface.runtimes);
        dump(demoParserInterface.runtimes+' done\n');
        if (demoParserInterface.runtimes < $('.runtimes').text())
          demoParserInterface.parse();
        else {
          $('#scoredParses').empty();
          for each (var parse in this.suggestionList) {
            $('<tr><td>'+parse.getDisplayText(true)+'</td></tr>').appendTo($('#scoredParses'));
          }

          demoParserInterface.endTime = new Date().getTime();

          dump('DURATION: '+(demoParserInterface.endTime - demoParserInterface.startTime)+'\n');
          $('.total').text(demoParserInterface.endTime - demoParserInterface.startTime);

          dump('AVG: '+(demoParserInterface.endTime - demoParserInterface.startTime)/demoParserInterface.runtimes+'\n');
          $('.avg').text(Math.round((demoParserInterface.endTime - demoParserInterface.startTime) * 100/demoParserInterface.runtimes)/100);

          
        }
      }
    }
    this.currentQuery.run();
    
  }
}


$(document).ready(function(){

  try {  
    var gUbiquity = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator).getMostRecentWindow("navigator:browser").gUbiquity;
    demoParserInterface.currentParser = gUbiquity.__cmdManager.__nlParser;
  } catch (e) {
    $('#gubiquity').show();
  }

  if (UbiquitySetup.parserVersion != 2) {
    $('#parser2').show();
  }
  
  function run() {
    demoParserInterface.startTime = new Date().getTime();
    $('.runtimes').text($('#times').val());
    demoParserInterface.runtimes = 0;
    demoParserInterface.parse();
  }
  
  $('.input').keyup(function(){ if ($('#autoparse')[0].checked) run()});
  $('#run').click(run);

  //$('#clearnouncache').click(function() { nounCache = []; });
  
  $('.toggle').click(function(e){$(e.currentTarget).siblings().toggle();});

});
