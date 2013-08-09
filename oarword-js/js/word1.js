/**
 * Created with JetBrains WebStorm.
 * User: xiechao
 * Date: 13-6-12
 * Time: 上午7:57
 * To change this template use File | Settings | File Templates.
 */
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.ImeHandler');
goog.require('goog.object');
goog.require('goog.fx.Dragger');

var page = null;
var cursor = null;
var box = null;
var imeHandler;
var ime = false;
var lineCount = 0;
var lineWidth = 900;
var selectBox = null;
var selectBoxStartPoint = {x:0, y:0};

function getLineFromPos(x ,y){
    var children = goog.dom.getChildren(page);
    //console.log("y:" + y);

    var line = null;
    var h = 80 + page.offsetTop;
    for( var i in children ) {
        if( children[i].id == 'line')
        {
            h += children[i].offsetHeight;
            //console.log("h:" + h);
            if( h > y ) {
                line = children[i];
                break;
            }
        }
    }
    //console.log(line);
    return line;
}

function getPrevChar(line, left) {
    var children = goog.dom.getChildren(line);

    var x = left - line.offsetLeft;
    var w = 0;
    var k = -1;
    for( var i in children ) {
        if( children[i] instanceof HTMLElement)
        {
            if( (w + children[i].offsetWidth) > x ) {
                break;
            } else {
                w += children[i].offsetWidth;
                k = i;
            }
        }
    }

    if( k == -1 ) {
        var preLine = goog.dom.getPreviousElementSibling(line);
        if( preLine != null ) {
            return goog.dom.getLastElementChild(preLine);
        } else {
            return null;
        }
    } else {
        return children[k];
    }
}

function getLineChar(line, left) {
    children = goog.dom.getChildren(line);

    if( children.length == 0 ) {
        return null;
    }

    var x = left - line.offsetLeft;
    var w = 0;
    var k = -1;
    for( var i in children ) {
        if( children[i] instanceof HTMLElement)
        {
            if( (w + children[i].offsetWidth) > x ) {
                break;
            } else {
                w += children[i].offsetWidth;
                k = i;
            }
        }
    }

    if( k == -1 ) {
        return null;
    } else {
        return children[k];
    }
}

function getCursorPos(line, point) {
    children = goog.dom.getChildren(line);

    var x = point.clientX - line.offsetLeft;
    var w = 0;
    for( var i in children ) {
        if( children[i] instanceof HTMLElement)
        {
            if( (w + children[i].offsetWidth) > x ) {
                break;
            } else {
                w += children[i].offsetWidth;
            }
        }
    }

    return line.offsetLeft + w;
}

function addLine() {
    var newx = 50;
    var newy = 50 + 30 * (lineCount + 1);

    var newLine = goog.dom.createDom('div');
    newLine.style.minHeight = '20px';
    newLine.style.width = '900px';
    newLine.style.position = 'relative';
    newLine.style.left = newx + 'px';
    newLine.style.top = newy + 'px';
    newLine.style.borderBottom = '1px solid #CCC';
    newLine.id = 'line';

    goog.events.listen(newLine, goog.events.EventType.CLICK, showBlinkingCursorHandler);

    goog.dom.appendChild(page, newLine);

    return newLine;
}

function blinkCursor() {

    if( cursor != null ) {
        if( cursor.style.backgroundColor == 'rgb(0, 0, 0)' ) {
            cursor.style.backgroundColor = 'rgb(255, 255, 255)';
        } else {
            cursor.style.backgroundColor = 'rgb(0, 0, 0)';
        }
    }
}

function getBlinkingCursor(x,y) {
    if( cursor == null ) {
        cursor = goog.dom.createDom('div');
        cursor.style.width = '2px';
        cursor.style.height = '20px';
        cursor.style.backgroundColor = '#000';
        cursor.style.position = 'absolute';
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';

        setInterval('blinkCursor();', 350);
        goog.dom.appendChild(document.body, cursor);

        return cursor;
    } else {
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
    }
}

function showBlinkingCursorHandler(event) {
    var target = event.currentTarget;
    //console.log(target);
    var x = getCursorPos(target, event);
    var y = target.offsetTop;
    //console.log(x + ',' + y);
    //getBlinkingCursor(x,y);

    // add input box

    if( box == null ) {
        box = goog.dom.createDom('div');
        box.style.width = '20px';
        box.style.height = '20px';
        box.style.position = 'absolute';
        box.style.left = x + 'px';
        box.style.top = y + 'px';
        box.contentEditable = true;
        box.style.outline = '0px';
        box.style.pointerEvents = 'none';

        goog.events.listen(box, goog.events.EventType.KEYDOWN, function(e){//------------------------------ delete
            if(e.keyCode == 8 ){
                var line = getLineFromPos(box.offsetLeft, box.offsetTop);
                var c = getPrevChar(line, box.offsetLeft);


                if( c != null ) {
                    var cp = goog.dom.getParentElement(c);
                    var cline = getLineFromPos(cp.offsetLeft, cp.offsetTop);

                    var cl = c.offsetLeft;
                    paragraphDelete(c, cline);

                    box.style.left = ( cline.offsetLeft + cl) + 'px';
                    box.style.top = cline.offsetTop + 'px';
                }
                /*
                var c = getLineChar(line, box.offsetLeft);
                if( c!= null ) {
                    var w = c.offsetWidth;
                    goog.dom.removeNode(c);
                    box.style.left = (box.offsetLeft - w) + 'px';
                }
                */
            }
        });

        goog.events.listen(box, goog.events.EventType.CLICK, function(e){//-------------------- box click event
            //e.currentTarget = getLineFromPos(e.clientX, e.clientY);
            //showBlinkingCursorHandler(e);
            //e.currentTarget = page;
            //goog.events.dispatchEvent(e, goog.events.EventType.CLICK);
        });

        goog.dom.appendChild(document.body, box);

        var imeHandler = new goog.events.ImeHandler(box);
        goog.events.listen(imeHandler, goog.object.getValues(goog.events.ImeHandler.EventType),
            function(e) {
                //console.log(e.type);
                if(e.type == 'startIme' ) {
                    ime = true;
                } else if(e.type == 'endIme' ) {
                    ime = false;
                }

            });

        goog.events.listen(box, goog.events.EventType.INPUT, function(e){ //------------------------------- input
            if( ime ) {
                //console.log('input jump');
                return;
            }

            var x = e.clientX;
            var y = e.clientY;

            //console.log(e.target.innerText);
            var c = e.target.innerText;
            e.target.innerText = '';
            var ch = goog.dom.createDom('span');
            //ch.style.width = 8;
            ch.innerHTML = c;
            var t = getLineFromPos(box.offsetLeft, box.offsetTop);
            var c = getLineChar(t, box.offsetLeft);

            var word = paragraphInput2(ch, t, c);
            var wordLine = goog.dom.getParentElement(word);
            box.style.left = (wordLine.offsetLeft + word.offsetLeft + word.offsetWidth) + 'px';
            box.style.top = wordLine.offsetTop + 'px';
        });
    } else {
        box.style.left = x + 'px';
        box.style.top = y + 'px';
    }

    box.focus();
}

function init() {
    //console.log('init()');
    page = goog.dom.getElement('page');

    page.style.height = '600px';
    page.style.width = '1000px';
    page.style.marginLeft = 'auto';
    page.style.marginRight = 'auto';
    page.style.backgroundColor = '#FFF';

    addLine();

    var setStyleButton = goog.dom.getElement('setstyle');
    goog.events.listen(setStyleButton, goog.events.EventType.CLICK, setSelectedStyle);
    //goog.events.listen(page, goog.events.EventType.CLICK, showBlinkingCursorHandler);

    goog.events.listen(page, goog.events.EventType.MOUSEDOWN, function(e) {
        var d = new goog.fx.Dragger(page);

        d.addEventListener(goog.fx.Dragger.EventType.START, function(e) {
            if( selectBox == null ){
                selectBox = goog.dom.createDom('div');
                //selectBox.style.border = '1px dotted rgb(186, 217, 245)';
                selectBox.style.backgroundColor = 'rgb(186, 217, 245)';
                selectBox.style.opacity = '0.5';
                selectBox.style.position = 'absolute';
                goog.dom.appendChild(document.body, selectBox);
            }

            selectBox.style.left = e.clientX + 'px';
            selectBox.style.top = e.clientY + 'px';
            selectBox.style.width = '5px';
            selectBox.style.minHeight = '5px';
            selectBox.style.visibility = 'visible';

            selectBoxStartPoint.x = e.clientX;
            selectBoxStartPoint.y = e.clientY;
        });

        d.addEventListener(goog.fx.Dragger.EventType.DRAG, function(e) {
            selectBox.style.left = Math.min(e.clientX, selectBoxStartPoint.x)  + 'px';
            selectBox.style.top = Math.min(e.clientY, selectBoxStartPoint.y)  + 'px';
            //console.log(selectBox.style.left + ", " + selectBox.style.top);

            selectBox.style.width = Math.abs(e.clientX - selectBoxStartPoint.x) + 'px';
            selectBox.style.height = Math.abs(e.clientY - selectBoxStartPoint.y)  + 'px';
            //console.log();
        });
        d.addEventListener(goog.fx.Dragger.EventType.END, function(e) {
            selectBox.style.visibility = 'hidden';
            d.dispose();
        });
        d.startDrag(e);
    });
}

//---------------------------------------------------------------------------------------------------- paragraph delete
function paragraphDelete(word, line) {
    goog.dom.removeNode(word);
    var children = goog.dom.getChildren(line);
    var w = 0;
    for( var i in children ) {
        if( children[i] instanceof HTMLElement ) {
            w += children[i].offsetWidth;
        }
    }
    var difWidth = lineWidth - w;


    // append
    var nextLine = goog.dom.getNextElementSibling(line);

    var nextAppend = new Array();
    //console.log(nextLine);
    if( nextLine != null ) {
        var nextChildren = goog.dom.getChildren(nextLine);
        var nw = 0;

        for( var i in nextChildren ) {
            if( children[i] instanceof HTMLElement ) {
                nw += nextChildren[i].offsetWidth;
                if( nw > difWidth ) {
                    break;
                } else {
                    nextAppend.push(nextChildren[i]);
                }
            }
        }

        for( var i in nextAppend ) {
            paragraphDelete(nextAppend[i], nextLine);
            goog.dom.appendChild(line, nextAppend[i]);
        }

        var nc = goog.dom.getChildren(nextLine);
        var ncc = 0;
        for( var i in nc ) {
            if( nc[i] instanceof HTMLElement ) {
                ncc++;
            }
        }
        if( ncc == 0 ){
            goog.dom.removeNode(nextLine);
        }
    }
}

//---------------------------------------------------------------------------------------------------- paragraph insert
function getNextLine(line) {
    var nextLine = goog.dom.getNextElementSibling(line);
    if( nextLine == null ) {
        nextLine = addLine();
    }

    return nextLine;
}

function paragraphInput(word, line, after) {
    var w = 0;
    var children = goog.dom.getChildren(line);
    var flag = true;
    var lineWidth = 100;

    var outof = new Array();

    if( after == null ) {
        w += word.offsetWidth;
    }

    for( var i in children ) {
        if( children[i] instanceof HTMLElement ){
            var cw = children[i].offsetWidth;

            if( w +cw > lineWidth ) {
                outof.push(children[i]);
            }
            w += cw;

            if( children[i] == after ) {
                if( w > 100 || (w+word.offsetWidth) > lineWidth ) {
                    outof.push(word);
                    flag = false;
                }

                w += word.offsetWidth;
            }
        }
    }
    // for outof parts
    outof.reverse();
    for( var i in outof ) {
        goog.dom.removeNode(outof[i]);
        paragraphInput(outof[i], getNextLine(line), null)
    }

    // for input part

    if( after != null ) {
        if( flag == true ) {
            goog.dom.insertSiblingAfter(word, after);
        }
    }else {
        goog.dom.insertChildAt(line, word, 0);
    }

    return word;
}

function paragraphInput2(word, line, after) {
    if( after != null ) {
        goog.dom.insertSiblingAfter(word, after);
    }else {
        goog.dom.insertChildAt(line, word, 0);
    }

    var w = 0;
    var children = goog.dom.getChildren(line);

    var outof = new Array();

    for( var i in children ) {
        if( children[i] instanceof HTMLElement ){
            var cw = children[i].offsetWidth;
            w += cw;
            if( w > lineWidth ) {
                outof.push(children[i]);
            }
        }
    }

    // for outof parts
    outof.reverse();
    for( var i in outof ) {
        goog.dom.removeNode(outof[i]);
        paragraphInput2(outof[i], getNextLine(line), null)
    }

    return word;
}

//----------------------------------------------------------------------------------------------------------- set style
function getSelectedChars() {
    function isBlockElement(el) {
        // You may want to add a more complete list of block level element
        // names on the next line
        return /span/i.test(el.tagName);
    }

    var sel = rangy.getSelection();
    if (sel.rangeCount) {
        var range = sel.getRangeAt(0);
        var blockElements = range.getNodes([1], isBlockElement);
        console.log(blockElements);
    }
}
function setStyle(char) {
    char.style.fontSize = '60px';
    char.style.color = '#ff0000';
}

function setSelectedStyle() {
    var selectes = getSelectedChars();
    for( var i in selectes ) {
        setStyle(selectes[i]);
    }
}