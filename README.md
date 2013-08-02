fluidGrid.js
============

This is a jQuery plugin that allows building intuitive draggable layouts from elements spanning multiple columns and rows.
Note: it's just a proof-of-concept; thanks to gridster.js for the inspiration.
Chrome, FireFox 4+, Safari 5.1.4+, Opera 12+, IE 9+

Methods usage
============

Initialize:

	$.fluidGrid({
		columns	: 4, // number of colums in your grid,
		rows	: 5, // number of rows in your grid,
		width	: 235, // width of the minimum cell
		height	: 100, // height of the minimum cell
		spacing : 10 // distance between adjacent cells
	});

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
Newly created block passed to the first argument of callback.

---

Remove block:

	$.fluidGrid('removeBlock', blockId);
	$.fluidGrid('removeBlock', Block);
	
Single param must an instance of Block class (type of Block === 'Block') or block id directly (you can store block id at 'addBlock' method callback).

License
============
Distributed under the MIT license.