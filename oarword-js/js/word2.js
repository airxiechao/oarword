/**
 * Created with JetBrains WebStorm.
 * User: xiechao
 * Date: 13-6-18
 * Time: 上午8:41
 * To change this template use File | Settings | File Templates.
 */
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.ImeHandler');
goog.require('goog.fx.Dragger');

goog.require('goog.ui.Tooltip');
goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.MenuSeparator');
goog.require('goog.ui.Option');
goog.require('goog.ui.Toolbar');
goog.require('goog.ui.ToolbarButton');
goog.require('goog.ui.ToolbarToggleButton');
goog.require('goog.ui.ToolbarMenuButton');
goog.require('goog.ui.ToolbarSelect');
goog.require('goog.ui.ToolbarSeparator');
goog.require('goog.ui.ComboBox');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.ToolbarColorMenuButton');
goog.require('goog.ui.ToolbarColorMenuButtonRenderer');
goog.require('goog.ui.ColorMenuButton');
goog.require('goog.ui.ColorMenuButtonRenderer');
goog.require('goog.ui.CustomColorPalette');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.FlatMenuButtonRenderer');

var oardoc;
var page;
var toolbar;

function init() {
    oardoc = new OarDoc();
    page = oardoc.addPage();
    new OarCursorMgr();
    new OarSelectionMrg;

    toolbar = new goog.ui.Toolbar();
    toolbar.render(goog.dom.getElement('oar-toolbar'));
    /*
    var testButton = new goog.ui.ToolbarButton('测试');
    toolbar.addChild(testButton, true);
    */
    // Add a selection
    var fontMenu = new goog.ui.Menu();
    goog.array.forEach(['Arial', '宋体'], function(font) {
        var item = new goog.ui.Option(font);
        fontMenu.addChild(item, true);
    });
    var fontSelector = new goog.ui.ToolbarSelect('字体', fontMenu);
    toolbar.addChild(fontSelector, true);
    goog.events.listen(fontSelector, 'change', function(e){console.log(e.target.getValue())});

    toolbar.addChild(new goog.ui.ToolbarSeparator(), true);

    var selectMenu = new goog.ui.Menu();
    goog.array.forEach([9, 10, 30, 50, 70], function(size) {
        var item = new goog.ui.Option(size + 'px');
        selectMenu.addChild(item, true);
    });
    var selector = new goog.ui.ToolbarSelect('字号', selectMenu);
    toolbar.addChild(selector, true);
    goog.events.listen(selector, 'change', function(e){
        var size = e.target.getValue();

        var range = OarSelectionMrg.prototype.range;
        if( range ) {
            for( var i in range ) {
                range[i].char.style.fontSize = size;
            }
        }

        OarSelectionMrg.prototype.rebuildMaskFromRange();
    });
    /*
    var cb = new goog.ui.CustomButton();
    toolbar.addChild(cb, true);

    var combo = new goog.ui.ComboBox();
    combo.setUseDropdownArrow(true);
    combo.render(cb.getElement());
    combo.getElement().getElementsByTagName('input')[0].style.width ='30px';
    combo.getElement().style.marginTop = '10px';

    combo.addItem(new goog.ui.ComboBoxItem('10'));
    combo.addItem(new goog.ui.ComboBoxItem('50'));
    combo.addItem(new goog.ui.ComboBoxItem('70'));

    goog.events.listen(combo, 'change', function(e){console.log(e.target.getValue())});
    */

    var tcmb1 = new goog.ui.ColorMenuButton('_A',
        goog.ui.ColorMenuButton.newColorMenu(),
        goog.ui.ToolbarColorMenuButtonRenderer.getInstance());
    toolbar.addChild(tcmb1, true);
    goog.events.listen(tcmb1, goog.ui.Component.EventType.ACTION, function(e){
        var color = tcmb1.getSelectedColor();
        var range = OarSelectionMrg.prototype.range;
        if( range ) {
            for( var i in range ) {
                range[i].char.style.color = color;
            }
        }
    });
    /*
    var cbin2 = new goog.ui.LabelInput();
    cbin2.render(cb.getElement());

    var cbm1 = new goog.ui.Menu();
    goog.array.forEach(['Friends', 'Family', 'Coworkers'],
        function(label) {
            var item = new goog.ui.MenuItem(label);
            item.setId(label);
            item.setDispatchTransitionEvents(goog.ui.Component.State.ALL, true);
            cbm1.addChild(item, true);
        });
    var cbmb1 = new goog.ui.ToolbarMenuButton(null, cbm1);
    cbmb1.setPositionElement(cbin2.getElement());
    toolbar.addChild(cbmb1, true);
    */
}

//---------------------------------------------------------------------------------------------------------------------- doc
var OarDoc = function () {
    this.ele = goog.dom.getElement('oar-doc');
}

OarDoc.prototype.getLastPage = function() {
    var children = goog.dom.getChildren(this.ele);
    var last = null;
    for( var i = children.length - 1; i >= 0; --i ) {
        if( children[i] instanceof HTMLElement && children[i].className == 'oar-page' ) {
            last = children[i];
            return last;
        }
    }
    return last;
}

OarDoc.prototype.getPageFromLine = function(line) {
    var children = goog.dom.getChildren(this.ele);
    for( var i in children ) {
        if( children[i] instanceof HTMLElement && children[i].className == 'oar-page' ) {
            var lx = line.getPositionX() + line.line.offsetWidth / 2;
            var ly = line.getPositionY() + line.line.offsetHeight / 2;
            var pTop = children[i].offsetTop;
            var pLeft = children[i].offsetLeft;
            var pWidth = children[i].offsetWidth;
            var pHeight = children[i].offsetHeight;

            if( (pTop < ly && pTop + pHeight > ly) &&
                (pLeft < lx && pLeft + pWidth > lx) ) {
                return children[i].wrapper;
            }
        }
    }
    return null;
}

OarDoc.prototype.addPage = function() {
    var newPage = new OarPage();
    var last = this.getLastPage();
    if( last ) {
        goog.dom.insertSiblingAfter(newPage.page, last);
    } else {
        goog.dom.appendChild(this.ele, newPage.page);
    }
    return newPage;
}

//---------------------------------------------------------------------------------------------------------------------- selection manager
var OarSelectionMrg = function() {
    if( OarSelectionMrg.prototype.selectBox == null ) {
        OarSelectionMrg.prototype.selectBox = goog.dom.createDom('div');
        OarSelectionMrg.prototype.selectBox.className = 'oar-docselection';
        OarSelectionMrg.prototype.selectBox.style.backgroundColor = 'rgb(186, 217, 245)';
        OarSelectionMrg.prototype.selectBox.style.opacity = '0.5';
        OarSelectionMrg.prototype.selectBox.style.position = 'absolute';
        OarSelectionMrg.prototype.selectBox.style.webkitUserSelect = 'none';
        OarSelectionMrg.prototype.selectBox.style.pointerEvents = 'none';
        OarSelectionMrg.prototype.selectBox.style.visibility = 'hidden';
        goog.dom.appendChild(goog.dom.getElement('oar-doc'), OarSelectionMrg.prototype.selectBox);

        goog.events.listen(page.page, goog.events.EventType.MOUSEDOWN, OarSelectionMrg.prototype.clickDragHandler);
    }
}

OarSelectionMrg.prototype.selectBox = null;
OarSelectionMrg.prototype.selectBoxStartPoint = {x:0,y:0};
OarSelectionMrg.prototype.left = 0;
OarSelectionMrg.prototype.top = 0;
OarSelectionMrg.prototype.bottom = 0;
OarSelectionMrg.prototype.right = 0;

OarSelectionMrg.prototype.range = null;
OarSelectionMrg.prototype.mask = null;

OarSelectionMrg.prototype.clickDragHandler = function(e) {
    var d = new goog.fx.Dragger(page.page);

    d.addEventListener(goog.fx.Dragger.EventType.START, function(e) {
        OarSelectionMrg.prototype.selectBox.style.left = e.clientX + 'px';
        OarSelectionMrg.prototype.selectBox.style.top = e.clientY + 'px';
        OarSelectionMrg.prototype.selectBox.style.width = '5px';
        OarSelectionMrg.prototype.selectBox.style.minHeight = '5px';

        OarSelectionMrg.prototype.selectBoxStartPoint.x = e.clientX;
        OarSelectionMrg.prototype.selectBoxStartPoint.y = e.clientY;
    });

    d.addEventListener(goog.fx.Dragger.EventType.DRAG, function(e) {
        //OarSelectionMrg.prototype.selectBox.style.visibility = 'visible';

        OarSelectionMrg.prototype.left = Math.min(e.clientX, OarSelectionMrg.prototype.selectBoxStartPoint.x);
        OarSelectionMrg.prototype.top = Math.min(e.clientY, OarSelectionMrg.prototype.selectBoxStartPoint.y);
        OarSelectionMrg.prototype.right = Math.max(e.clientX, OarSelectionMrg.prototype.selectBoxStartPoint.x);
        OarSelectionMrg.prototype.bottom = Math.max(e.clientY, OarSelectionMrg.prototype.selectBoxStartPoint.y);

        OarSelectionMrg.prototype.selectBox.style.left = Math.min(e.clientX, OarSelectionMrg.prototype.selectBoxStartPoint.x)  + 'px';
        OarSelectionMrg.prototype.selectBox.style.top = Math.min(e.clientY, OarSelectionMrg.prototype.selectBoxStartPoint.y)  + 'px';
        OarSelectionMrg.prototype.selectBox.style.width = Math.abs(e.clientX - OarSelectionMrg.prototype.selectBoxStartPoint.x) + 'px';
        OarSelectionMrg.prototype.selectBox.style.height = Math.abs(e.clientY - OarSelectionMrg.prototype.selectBoxStartPoint.y)  + 'px';

        // remove old range and mask
        OarSelectionMrg.prototype.clear();

        // add new range and mask
        page.getAndMaskRangeElements(OarSelectionMrg.prototype.left, OarSelectionMrg.prototype.top,
            OarSelectionMrg.prototype.right, OarSelectionMrg.prototype.bottom);

        for( var i in OarSelectionMrg.prototype.mask ) {
            goog.dom.appendChild(page.page, OarSelectionMrg.prototype.mask[i]);
        }

    });

    d.addEventListener(goog.fx.Dragger.EventType.END, function(e) {
        //OarSelectionMrg.prototype.selectBox.style.visibility = 'hidden';
        OarSelectionMrg.prototype.selectBox.style.left = 0 + 'px';
        OarSelectionMrg.prototype.selectBox.style.top = 0 + 'px';
        OarSelectionMrg.prototype.selectBox.style.width = '1px';
        OarSelectionMrg.prototype.selectBox.style.minHeight = '1px';
        d.dispose();

        //OarSelectionMrg.prototype.clear();
    });

    d.startDrag(e);
}

OarSelectionMrg.prototype.rebuildMaskFromRange = function() {
    var oldMask = OarSelectionMrg.prototype.mask;
    if( oldMask ) {
        for( var i in oldMask ) {
            goog.dom.removeNode(oldMask[i])
        }
        OarSelectionMrg.prototype.mask = null;
    }

    var range = OarSelectionMrg.prototype.range;
    if( range ) {
        var leftUpChar = range[0];
        var rightBottomChar = range[range.length - 1];

        var left = leftUpChar.getPositionX();
        var up = leftUpChar.getPositionY();
        var right = rightBottomChar.getPositionX();
        var bottom = rightBottomChar.getPositionY();

        var leftUpLine = leftUpChar.getLine();
        var rightBottomLine = rightBottomChar.getLine();

        if( leftUpChar == null || rightBottomChar == null ) {
            return;
        }

        var mask = new Array();
        var bStart = false;
        var bFinish = false;
        var line = leftUpLine;

        while( line && !bFinish ) {
            var children = goog.dom.getChildren(line.line);
            var lineMask = null;
            var lineMaskWidth = 0;

            for( var i in children ) {
                if( children[i] instanceof HTMLElement ) {
                    // add mask
                    if( i == 0 ) {
                        lineMask = goog.dom.createDom('div');
                        lineMask.style.cursor = 'text';
                        lineMask.style.position = 'absolute';
                        lineMask.style.opacity = 0.2;
                        lineMask.style.backgroundColor = 'rgb(0, 133, 255)';
                        lineMask.style.height = line.line.offsetHeight + 'px';
                        lineMask.style.top = line.line.offsetTop + 'px';
                        mask.push(lineMask);
                    }
                    if( leftUpChar.char == children[i] ) {
                        bStart = true;
                        lineMask.style.left = children[i].offsetLeft  + 'px';
                    }

                    if( bStart ) {
                        lineMaskWidth += children[i].offsetWidth;
                        lineMask.style.width = lineMaskWidth + 'px';
                    }

                    if( rightBottomChar.char == children[i] ){
                        bFinish = true;
                        break;
                    }
                }
            }

            line = line.getNextLineNoAppend();
        }
        OarSelectionMrg.prototype.mask = mask;

        if( mask ) {
            for( var i in mask ) {
                goog.dom.appendChild(page.page, mask[i]);
            }
        }
    }
}

OarSelectionMrg.prototype.clear = function() {
    if( OarSelectionMrg.prototype.mask != null ){
        for( var i in OarSelectionMrg.prototype.mask ) {
            goog.dom.removeNode(OarSelectionMrg.prototype.mask[i]);
        }
    }

    OarSelectionMrg.prototype.mask = null;
    OarSelectionMrg.prototype.range = null;
}

//---------------------------------------------------------------------------------------------------------------------- cursor manager
var OarCursorMgr = function() {
    if( this.singleton == null ) {
        var doc = goog.dom.getElement('oar-doc');
        var cursor = goog.dom.createDom('div');
        cursor.className = 'oar-cursor';
        cursor.contentEditable = true;
        cursor.style.pointerEvents = 'none';
        cursor.style.width = '2px';
        cursor.style.height = '20px';
        cursor.style.position = 'absolute';
        cursor.style.outline = '0px';
        //cursor.style.borderLeft = '2px solid #000';
        //cursor.style.textIndent = '-1px';

        this.ime = false;
        this.cursor = cursor;
        goog.dom.appendChild(doc, cursor);

        OarCursorMgr.prototype.singleton = this;

        // handle ime event
        var imeHandler = new goog.events.ImeHandler(OarCursorMgr.prototype.singleton.cursor);
        goog.events.listen(imeHandler, goog.object.getValues(goog.events.ImeHandler.EventType),
            function(e) {
                if(e.type == 'startIme' ) {
                    OarCursorMgr.prototype.singleton.ime = true;
                } else if(e.type == 'endIme' ) {
                    OarCursorMgr.prototype.singleton.ime = false;
                    OarCursorMgr.prototype.setWidth(2);
                    var char = OarCursorMgr.prototype.pointChar;
                    if( char ) {
                        char.char.style.marginLeft = '0px';
                    }
                } if(e.type == 'updateIme') {
                }

            }
        );

        // handle keydown

        goog.events.listen(OarCursorMgr.prototype.singleton.cursor, goog.events.EventType.KEYDOWN,
            function(e){
                var x = OarCursorMgr.prototype.singleton.cursor.offsetLeft;
                var y = OarCursorMgr.prototype.singleton.cursor.offsetTop;
                var line = page.getLineFromPosition(x, y);
                var char = line.getCharFromPosition(x, y);
                //console.log(e.keyCode);

                switch(e.keyCode) {
                    // key delete
                    case 8:
                    {
                        var left = char.getLeftChar();

                        if( left != null ) {
                            var leftLine = left.getLine();
                            leftLine.deleteChar(left);

                            OarCursorMgr.prototype.setPositionByChar(char);
                        }

                        break;
                    }
                    // key enter
                    case 13:
                    {

                        // find the right parts
                        var rightParts = line.getRightParts(char);
                        line.removeParts(rightParts);
                        rightParts.reverse();

                        // add a new EOL to line
                        var eol = new OarChar('');
                        eol.setEOL();
                        var left = char.getLeftChar();

                        if( left == null ) {
                            goog.dom.appendChild(line.line, eol.char);
                        } else {
                            if( !left.isEOL() ) {
                                goog.dom.insertSiblingAfter(eol.char, left.char);
                            } else {
                                goog.dom.appendChild(line.line, eol.char);
                            }
                        }

                        var nextLine = null;
                        for( var i in rightParts ) {
                            nextLine = line.getNextLineNoAppend();
                            if( nextLine == null ) {
                                var p = oardoc.getPageFromLine(line);
                                nextLine = p.insertLineAfter(line);
                            }
                            var first = nextLine.getFirstBlock();
                            nextLine.insertCharBefore(rightParts[i], first);
                        }

                        nextLine = line.getNextLineNoAppend();
                        OarCursorMgr.prototype.singleton.setPositionByLineFirst(nextLine);

                        break;
                    }
                    // left
                    case 37:
                    {
                        if( char == null ) {
                            var preLine = line.getPreLine();
                            if( preLine != null ) {
                                OarCursorMgr.prototype.singleton.setPositionByLineLast(preLine);
                            }
                        } else {
                            var left = char.getLeftChar();
                            if( left == null ) {
                                OarCursorMgr.prototype.singleton.setPositionByLineFirst(line);
                            }else {
                                OarCursorMgr.prototype.singleton.setPositionByChar(left);
                            }
                        }
                        break;
                    }
                    // up
                    case 38:
                    {
                        var preLine = line.getPreLine();
                        if( preLine ) {
                            var newy = preLine.getPositionY() + preLine.getHeight() / 2;
                            var preChar = page.getCharFromPosition(x, newy);
                            if( preChar ) {
                                OarCursorMgr.prototype.singleton.setPositionByChar(preChar);
                            } else {
                                OarCursorMgr.prototype.singleton.setPositionByLineFirst(preLine);
                            }
                        }

                        break;
                    }
                    // right
                    case 39:
                    {
                        if( char == null ) {
                            var first = line.getFirstBlock();
                            if( first != null ) {
                                OarCursorMgr.prototype.singleton.setPositionByChar(first);
                            }
                        } else {
                            var right = char.getRightChar();
                            if( right == null ) {
                                var nextLine = line.getNextLineNoAppend();
                                if( nextLine ) {
                                    OarCursorMgr.prototype.singleton.setPositionByLineFirst(nextLine);
                                }
                            } else {
                                OarCursorMgr.prototype.singleton.setPositionByChar(right);
                            }
                        }
                        break;
                    }
                    // down
                    case 40:
                    {
                        var nextLine = line.getNextLineNoAppend();
                        if( nextLine ) {
                            var newy = nextLine.getPositionY() + nextLine.getHeight() / 2;
                            var nextChar = page.getCharFromPosition(x, newy);
                            if( nextChar ) {
                                OarCursorMgr.prototype.singleton.setPositionByChar(nextChar);
                            } else {
                                OarCursorMgr.prototype.singleton.setPositionByLineFirst(nextLine);
                            }
                        }

                        break;
                    }
                }
            }
        );

        // handle char input event
        goog.events.listen(OarCursorMgr.prototype.singleton.cursor, goog.events.EventType.INPUT,
            function(e){
                if( OarCursorMgr.prototype.singleton.ime ) {
                    // calculate the ime text width
                    var calSpan = goog.dom.createDom('span');
                    calSpan.innerText = OarCursorMgr.prototype.singleton.cursor.innerText;
                    calSpan.style.visibility = 'hidden';
                    goog.dom.appendChild(page.page, calSpan);
                    var cursorWidth = calSpan.offsetWidth;
                    var length = OarCursorMgr.prototype.singleton.cursor.innerText.length;
                    var char = OarCursorMgr.prototype.pointChar;
                    if( char ) {
                        char.char.style.marginLeft = cursorWidth + length + 'px';
                    }
                    OarCursorMgr.prototype.setWidth(cursorWidth + length);
                    //goog.dom.removeNode(calSpan);

                    return;
                }

                if( OarCursorMgr.prototype.singleton.cursor.innerHTML.indexOf('br') > 0 ) {
                    OarCursorMgr.prototype.singleton.cursor.innerHTML = '';
                    return;
                }

                var x = OarCursorMgr.prototype.singleton.pointChar.offsetLeft;
                var y = OarCursorMgr.prototype.singleton.pointChar.offsetTop;
                var text = e.target.innerText;
                e.target.innerText = '';
                var length = text.length;

                for( var i in text ) {
                    var char = new OarChar(text[i]);

                    var before = OarCursorMgr.prototype.singleton.pointChar;
                    var line = before.getLine();
                    line.insertCharBefore(char, before);

                    var newh = before.getHeight();

                    OarCursorMgr.prototype.singleton.setPositionByChar(before);
                    OarCursorMgr.prototype.singleton.setHeight(newh);
                }
            }
        );
    }
}

OarCursorMgr.prototype.singleton = null;
OarCursorMgr.prototype.pointChar = null;

OarCursorMgr.prototype.setPointCharByNowPosition = function() {
    var x = OarCursorMgr.prototype.getPositionX();
    var y = OarCursorMgr.prototype.getPositionY();

    OarCursorMgr.prototype.pointChar = page.getCharFromPosition(x, y);
}

OarCursorMgr.prototype.getPositionX = function() {
   return OarCursorMgr.prototype.singleton.cursor.offsetLeft;
}

OarCursorMgr.prototype.getPositionY = function() {
    return OarCursorMgr.prototype.singleton.cursor.offsetTop;
}

OarCursorMgr.prototype.getCharFromCursor = function() {
    var x = OarCursorMgr.prototype.getPositionX();
    var y = OarCursorMgr.prototype.getPositionY();

    return page.getCharFromPosition(x, y);
}

OarCursorMgr.prototype.setPositionByLineFirst = function(line) {
    if( line ) {
        var first = line.getFirstBlock();
        var x = first.getPositionX();
        var y = first.getPositionY();
        var h = first.getHeight();

        OarCursorMgr.prototype.setPosition(x, y);
        OarCursorMgr.prototype.setHeight(h);
        OarCursorMgr.prototype.pointChar = first;
    }
}

OarCursorMgr.prototype.setPositionByLineLast = function(line) {
    if( line ) {
        var last =  line.getLastBlock();
        if( last == null ) {
            return null;
        }

        var x = last.getPositionX() + last.getWidth();
        var y = last.getPositionY();
        var h = last.getHeight();

        OarCursorMgr.prototype.setPosition(x, y);
        OarCursorMgr.prototype.setHeight(h);
        OarCursorMgr.prototype.pointChar = last;
    }
}

OarCursorMgr.prototype.setPositionByChar = function(char) {
    if( char ) {
        var x = char.getPositionX();
        var y = char.getPositionY();
        var h = char.getHeight();

        OarCursorMgr.prototype.setPosition(x, y);
        OarCursorMgr.prototype.setHeight(h);

        OarCursorMgr.prototype.pointChar = char;
    }
}
OarCursorMgr.prototype.setPosition = function(x, y) {
    if( OarCursorMgr.prototype.singleton ) {
        OarCursorMgr.prototype.singleton.cursor.style.left = x + 'px';
        OarCursorMgr.prototype.singleton.cursor.style.top = y + 'px';
    }
}

OarCursorMgr.prototype.focus = function() {
    if( OarCursorMgr.prototype.singleton ) {
        OarCursorMgr.prototype.singleton.cursor.focus();
        //OarCursorMgr.prototype.singleton.cursor.style.opacity = 0.1;
    }
}

OarCursorMgr.prototype.setHeight = function(h) {
    if( OarCursorMgr.prototype.singleton ) {
        OarCursorMgr.prototype.singleton.cursor.style.height = h + 'px';
    }
}

OarCursorMgr.prototype.setWidth = function(w) {
    if( OarCursorMgr.prototype.singleton ) {
        OarCursorMgr.prototype.singleton.cursor.style.width = w + 'px';
    }
}

//---------------------------------------------------------------------------------------------------------------------- page
var OarPage = function() {
    var doc = goog.dom.getElement('oar-doc');
    this.page = goog.dom.createDom('div');
    this.page.wrapper = this;
    this.page.className = 'oar-page';
    this.page.style.width = OarLine.prototype.fixedWidth + 'px';
    this.page.style.height = OarPage.prototype.fixedHeight + 'px';
    this.page.style.marginLeft = 'auto';
    this.page.style.marginRight = 'auto';
    this.page.style.marginTop = '10px';
    this.page.style.marginBottom = '10px';
    this.page.style.border = '1px solid #CCC'
    this.page.style.backgroundColor = '#FFF';
    this.page.style.webkitUserSelect = 'none';

    this.page.style.fontSize = '15px';
    this.page.style.fontFamily = 'Arial';
    this.page.style.padding = '95px 125px 95px 125px';
    //goog.dom.appendChild(doc,this.page);

    goog.events.listen(this.page, goog.events.EventType.CLICK, this.clickHandler);
}

OarPage.prototype.fixedHeight = 200;

OarPage.prototype.getNextPage = function() {
    var next = goog.dom.getNextElementSibling(this.page);
    if( next && next.className == 'oar-page' ) {
        return next.wrapper;
    } else {
        return oardoc.addPage();
    }
}

OarPage.prototype.getPrePage = function() {
    var pre = goog.dom.getPreviousElementSibling(this.page);
    if( pre && pre.className == 'oar-page' ) {
        return pre;
    } else {
        return null;
    }
}

OarPage.prototype.clickHandler = function(e) {
    OarSelectionMrg.prototype.clear();
    var line = this.wrapper.getLineFromPosition(e.clientX, e.clientY);
    var char = line.getCharFromPosition(e.clientX, e.clientY);

    var cx, cy, ch;
    if( char ) {
        OarCursorMgr.prototype.setPositionByChar(char);
        OarCursorMgr.prototype.pointChar = char;
    } else {
        OarCursorMgr.prototype.setPositionByLineLast(line);
        OarCursorMgr.prototype.pointChar = null;
    }

    OarCursorMgr.prototype.focus();
}

OarPage.prototype.getAndMaskRangeElements = function(left, up, right, bottom) {
    var leftUpLine = page.getLineFromPosition(left, up);
    var rightBottomLine = page.getLineFromPosition(right, bottom);

    var leftUpChar = leftUpLine.getCharFromPosition(left, up);
    var rightBottomChar = rightBottomLine.getCharFromPosition(right, bottom);

    if( leftUpChar == null || rightBottomChar == null ) {
        return new Array();
    }

    var range = new Array();
    var mask = new Array();
    var bStart = false;
    var bFinish = false;
    var line = leftUpLine;

    while( line && !bFinish ) {
        var children = goog.dom.getChildren(line.line);
        var lineMask = null;
        var lineMaskWidth = 0;

        for( var i in children ) {
            if( children[i] instanceof HTMLElement ) {
                // add mask
                if( i == 0 ) {
                    lineMask = goog.dom.createDom('div');
                    lineMask.style.cursor = 'text';
                    lineMask.style.position = 'absolute';
                    lineMask.style.opacity = 0.2;
                    lineMask.style.backgroundColor = 'rgb(0, 133, 255)';
                    lineMask.style.height = line.line.offsetHeight + 'px';
                    lineMask.style.top = line.line.offsetTop + 'px';
                    mask.push(lineMask);
                }
                if( leftUpChar.char == children[i] ) {
                    bStart = true;
                    lineMask.style.left = children[i].offsetLeft  + 'px';
                }

                if( bStart ) {
                    range.push(children[i].wrapper);

                    lineMaskWidth += children[i].offsetWidth;
                    lineMask.style.width = lineMaskWidth + 'px';
                }

                if( rightBottomChar.char == children[i] ){
                    bFinish = true;
                    break;
                }
            }
        }

        line = line.getNextLineNoAppend();
    }

    OarSelectionMrg.prototype.range = range;
    OarSelectionMrg.prototype.mask = mask;
}

OarPage.prototype.insertLineBefore = function(before) {
    var line = new OarLine();
    goog.dom.insertSiblingBefore(line.line, before.line);

    return line;
}

OarPage.prototype.insertLineAfter = function(after) {
    var line = new OarLine();
    goog.dom.insertSiblingAfter(line.line, after.line);
    if( this.getAllLineHeight() > this.fixedHeight ) {
        goog.dom.removeNode(line.line);
        var page = this.getNextPage();
        line = page.appendLine();
    }

    return line;
}

OarPage.prototype.getCharFromPosition = function(x, y) {
    var line = this.getLineFromPosition(x, y);
    var char = line.getCharFromPosition(x, y);

    return char;
}

OarPage.prototype.getLineFromPosition = function(x, y) {
    var children = goog.dom.getChildren(this.page);
    if( children.length == 0 ) {
        var line =  this.appendLine();
        var eol = new OarChar('');
        eol.setEOL();
        goog.dom.appendChild(line.line, eol.char);
        return line;
    }

    var hs = 0;
    var line = null;
    for( var i in children ) {
        if( children[i].className == 'oar-line' ) {
            hs = children[i].offsetTop + children[i].offsetHeight;
            if( hs > y ) {
                line = children[i];
                break;
            }

            line = children[i];
        }
    }

    return line.wrapper;
}

OarPage.prototype.getAllLineHeight = function() {
    var children = goog.dom.getChildren(this.page);
    var hs = 0;
    for( var i in children ) {
        if( children[i] instanceof HTMLElement && children[i].className == 'oar-line' ) {
            hs += children[i].offsetHeight;
        }
    }

    return hs;
}

OarPage.prototype.appendLine = function() {
    var line = new OarLine();
    goog.dom.appendChild(this.page, line.line);

    if( this.getAllLineHeight() > this.fixedHeight ) {
        goog.dom.removeNode(line.line);
        var page = this.getNextPage();
        line = page.appendLine();
    }

    return line;
}
OarPage.prototype.popLine = function() {

}

OarPage.prototype.findLine = function(x ,y) {

}

//---------------------------------------------------------------------------------------------------------------------- line
var OarLine = function() {
    this.line = goog.dom.createDom('div');
    this.line.wrapper = this;
    this.line.className = 'oar-line';
    this.line.style.minHeight = '20px';
    //this.line.style.borderBottom = '1px solid #CCC';
}

OarLine.prototype.fixedWidth = 625;

OarLine.prototype.calElementsWidth = function () {
    var children = goog.dom.getChildren(this.line);
    var w = 0;
    for( var i in children ) {
        if( children[i] instanceof HTMLElement && !children[i].wrapper.isEOL()) {
            w += children[i].offsetWidth;
        }
    }
    return w;
}

OarLine.prototype.deleteChar = function(char) {
    goog.dom.removeNode(char.char);

    // append
    this.lessWidthDeal();
}

OarLine.prototype.getFirstBlock = function() {
    var first = goog.dom.getFirstElementChild(this.line)
    if( first != null ) {
        return first.wrapper;
    }
    return first;
}

OarLine.prototype.getLastBlock = function() {
    var last = goog.dom.getLastElementChild(this.line);
    if( last != null ) {
        return last.wrapper;
    }
    return last;
}

OarLine.prototype.isOverWidth = function() {
    var children = goog.dom.getChildren(this.line);

    var w = 0;
    for(var i in children) {
        if( children[i] instanceof HTMLElement ) {
            if( !children[i].wrapper.isEOL() ){
                w += children[i].offsetWidth;
            }
        }
    }

    return w > this.fixedWidth;
}

OarLine.prototype.appendChar = function(char) {
    var last = goog.dom.getLastElementChild(this.line);
    if( last ) {
        this.insertCharAfter(char, last.wrapper);
    } else {
        this.insertCharAfter(char, null);
    }
}

OarLine.prototype.removeParts = function(parts) {
    for( var i in parts ) {
        goog.dom.removeNode(parts[i]);
    }
}

OarLine.prototype.getRightParts = function(block) {
    var children = goog.dom.getChildren(this.line);
    var rParts = new Array();
    var touch = false;

    for( var i in children ) {
        if( children[i] instanceof HTMLElement) {
            if( touch ) {
                rParts.push(children[i].wrapper);
            } else {
                if( block.char === children[i] ) {
                    touch = true;
                    rParts.push(children[i].wrapper);
                }
            }
        }
    }

    return rParts;
}

OarLine.prototype.getOverWidthParts = function() {
    var children = goog.dom.getChildren(this.line);
    var w = 0;
    var overParts = new Array();
    for( var i in children ) {
        if( children[i] instanceof HTMLElement ) {
            w += children[i].offsetWidth;
            if( w > this.fixedWidth ) {
                overParts.push(children[i]);
            }
        }
    }

    return overParts;
}

OarLine.prototype.getPreLine = function() {
    var pre = null;
    pre = goog.dom.getPreviousElementSibling(this.line);
    if( pre != null ) {
        pre = pre.wrapper;
    }
    return pre;
}

OarLine.prototype.getNextLineNoAppend = function() {
    var next = null;
    next = goog.dom.getNextElementSibling(this.line);
    if( next != null ) {
        next = next.wrapper;
    }

    return next;
}

OarLine.prototype.getNextLine = function() {
    var next = null;
    next = goog.dom.getNextElementSibling(this.line);
    if( next == null ) {
        next = page.appendLine();
    }else {
        next = next.wrapper;
    }

    return next;
}

OarLine.prototype.lessWidthDeal = function() {
    var difWidth = OarLine.prototype.fixedWidth - this.calElementsWidth();
    var nextLine = goog.dom.getNextElementSibling(this.line);
    var nextAppend = new Array();

    if( this.getLastBlock() && this.getLastBlock().isEOL() ) {
        return;
    }
    if( nextLine != null ) {
        var nextChildren = goog.dom.getChildren(nextLine);
        var nw = 0;

        for( var i in nextChildren ) {
            if( nextChildren[i] instanceof HTMLElement ) {
                nw += nextChildren[i].offsetWidth;
                if( nw > difWidth ) {
                    break;
                } else {
                    nextAppend.push(nextChildren[i]);
                }
            }
        }

        for( var i in nextAppend ) {
            nextLine.wrapper.deleteChar(nextAppend[i].wrapper);
            goog.dom.appendChild(this.line, nextAppend[i]);
        }

        var nnCount = nextLine.childElementCount;

        if( nnCount == 0 ) {
            goog.dom.removeNode(nextLine);
        }
    }
}

OarLine.prototype.overWidthDeal = function() {
    if( this.isOverWidth() ) {
        var over = this.getOverWidthParts();
        over.reverse();

        for( var i in over ) {
            goog.dom.removeNode(over[i]);
            var nextLine = this.getNextLineNoAppend();
            if( nextLine == null ) {
                nextLine = page.insertLineAfter(this);
            }

            var first = nextLine.getFirstBlock();
            nextLine.insertCharBefore(over[i].wrapper, first);
        }
    }
}

OarLine.prototype.insertCharBefore = function(char, before) {
    if( char.isEOL() ) {
        var count = this.line.childElementCount;
        if( count == 0 ) {
            goog.dom.insertChildAt(this.line, char.char, 0);
        }else {
            var toLine = page.insertLineBefore(this);
            //console.log(toLine);
            goog.dom.insertChildAt(toLine.line, char.char, 0);
        }

        return;
    }
    goog.dom.insertSiblingBefore(char.char, before.char);
    this.overWidthDeal();
}

/*
OarLine.prototype.insertCharAfter = function(char, after) {
    if( after == null ) {
        var toLine = this;
        if( char.isEOL() ) {
            toLine = page.insertLineBefore(this);
        }
        goog.dom.insertChildAt(toLine.line, char.char, 0);
        return;

    } else {
        goog.dom.insertSiblingAfter(char.char, after.char);
    }

    this.overWidthDeal();
}
*/

OarLine.prototype.getCharFromPosition = function(x, y) {
    var children = goog.dom.getChildren(this.line);

    var c = null;
    for( var i in children ) {
        if( children[i] instanceof HTMLElement ) {
            if( children[i].offsetLeft > x ) {
                break;
            }
            c = children[i];
        }
    }

    if( c != null ) {
        return c.wrapper;
    }else {
        return null;
    }

}

OarLine.prototype.getPositionX = function() {
    return this.line.offsetLeft;
}

OarLine.prototype.getPositionY = function() {
    return this.line.offsetTop;
}

OarLine.prototype.getHeight = function() {
    return this.line.offsetHeight;
}

//---------------------------------------------------------------------------------------------------------------------- char
var OarChar = function(c) {
    this.char = goog.dom.createDom('span');
    this.char.wrapper = this;
    this.char.className = 'oar-char';
    this.char.innerText = c;
}

OarChar.prototype.getLine = function() {
    var x = this.getPositionX();
    var y = this.getPositionY();
    var line = page.getLineFromPosition(x, y);
    return line;
}

OarChar.prototype.getRightChar = function() {
    var right = goog.dom.getNextElementSibling(this.char);
    if( right != null ) {
        right = right.wrapper;
    }else {
        var x = this.getPositionX();
        var y = this.getPositionY();
        var line = page.getLineFromPosition(x, y);
        var nextLine = line.getNextLineNoAppend();

        if( nextLine ) {
            right = nextLine.getFirstBlock();
        }
    }
    return right;
}

OarChar.prototype.getLeftChar = function() {
    var left = goog.dom.getPreviousElementSibling(this.char);
    if( left != null ) {
        left = left.wrapper;
    } else {
        var x = this.getPositionX();
        var y = this.getPositionY();
        var line = page.getLineFromPosition(x, y);
        var preLine = line.getPreLine();
        if( preLine ) {
            left = preLine.getLastBlock();
        }
    }
    return left;
}

OarChar.prototype.getPositionX = function() {
    return this.char.offsetLeft;
}

OarChar.prototype.getPositionY = function() {
    return this.char.offsetTop;
}

OarChar.prototype.getHeight = function() {
    return this.char.offsetHeight;
}

OarChar.prototype.getWidth = function() {
    return this.char.offsetWidth;
}

OarChar.prototype.setEOL = function() {
    this.char.className = 'oar-eolchar';
    this.char.innerText = '^';
    //this.char.style.visibility = 'hidden';
}

OarChar.prototype.isEOL = function() {
    return this.char.className == 'oar-eolchar';
}