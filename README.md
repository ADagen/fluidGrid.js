fluidGrid.js
============

This is a jQuery plugin that allows building intuitive draggable layouts from elements spanning multiple columns and rows.
While dragging a block the remaining blocks will flow around it with smooth animation.
Also you can resize any blocks, plugin will reflow other blocks.
Note: it's just a proof-of-concept; thanks to gridster.js for the inspiration.
Chrome, FireFox 4+, Safari 5.1.4+, Opera 12+, IE 9+

Demo: http://dagenniger.ipage.com/fluidGrid/demo.html
Run tests: http://dagenniger.ipage.com/fluidGrid/demo.html?test=enabled

Methods
============

Create grid:

	$.fluidGrid({
		columns	: 4, // number of colums in your grid,
		rows	: 5, // number of rows in your grid,
		width	: 235, // width of the minimum cell
		height	: 100, // height of the minimum cell
		spacing : 10 // distance between adjacent cells
	});
	
The grid will created immediately.
Warn: width and height of target htmlNode element will changed due to the necessity to position the blocks within.

---

Add new block:

	$.fluidGrid('addBlock', {
		colspan	: 1,
		rowspan	: 2,
		left	: 0,
		top		: 0,
		url		: '' // url to loading widget, not done yet
	}, callback);
	
First parameter is an object literal with options,
and the second parameter is a function called after adding block to a grid when a load widget event occurs.
Newly created block passed to the first argument of callback; {Block} block have a couple of methods for interacting with a custom widget.
More about Block class: https://github.com/dagen-niger/fluidGrid.js/blob/master/BLOCK.md (russian language!)

---

Remove block:

	$.fluidGrid('removeBlock', blockId, callback);
	$.fluidGrid('removeBlock', Block, callback);
	
Single param must an instance of Block class (type of Block === 'Block') or block id directly (you can store block id at 'addBlock' method callback).
Function "callback" execute only after response of corresponding widget, although the block is removed from the array Grid.blocks[] immediately.

---

Destroy grid:

	$.fluidGrid('destroy', success, error);
	
Both params are callback functions and called upon the responses from all widgets.

License
============
Distributed under the MIT license.