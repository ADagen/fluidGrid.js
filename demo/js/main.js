(function($) {

var myRegistry = [];

$(document).ready(initPage);

/**
 * Создаёт собственно внешний вид таблицы
 */
function initPage() {

	createGrid();
	
	setTimeout(function() {
		$('#widgets').fluidGrid('removeBlock', myRegistry[3]);
		alert('Тест удаления блока: пройден, если блок №3 удалён');
	}, 3000);
	
	setTimeout(function() {
		$('#widgets').fluidGrid('destroy');
		alert('Тест удаления всей таблицы, ещё через 3 секунды будет создана заново');
	}, 6000);
	
	setTimeout(function() {
		createGrid();
	}, 9000);
}

/**
 * Отладочная функция, создаёт и наполняет таблицу
 */
function createGrid() {
	$('#widgets').fluidGrid({
		columns	: 4,
		rows	: 5,
		width	: 235,
		height	: 100,
		spacing : 10
	});
	
	loadWidgetsFromServer(function(response) {
		response.forEach(function(block) {
			$('#widgets').fluidGrid('addBlock', block, initializeWidget);
		});
	});
}

/**
 * Отладочная функция, таймаутом имитирует загрузку виджетов с сервера,
 * использует тестовый набор виджетов
 */
function loadWidgetsFromServer(onLoad) {
	setTimeout(function() {
		onLoad(sampleBlocks);
	}, 10);
}

/**
 * Отладочная функция, имитирует инициализацию виджета
 */
function initializeWidget(block) {
	var small 	= $('<div>', { 'class' : 'button button-small'	, 'title' : 'Small' }),
		medium 	= $('<div>', { 'class' : 'button button-medium'	, 'title' : 'Medium'}),
		big 	= $('<div>', { 'class' : 'button button-big'	, 'title' : 'Big'}),
		title	= $('<div>', { 'class' : 'title'}).html(block.uid);
	
	myRegistry.push(block);
	block.$html.append(big, medium, small, title);
	
	small.on(	'click touch', block.switchSize.bind(block, 1, 1));
	medium.on(	'click touch', block.switchSize.bind(block, 1, 2));
	big.on(		'click touch', block.switchSize.bind(block, 2, 4));
}

/**
 * Отладочный набор виджетов
 */
sampleBlocks = [{
	colspan	: 1,	// размер блока по горизонтали (измеряется в базовых ячейках)
	rowspan	: 2,	// размер блока по вертикали
	left	: 0,	// абсцисса блока, (0;0) - левый верхний угол
	top		: 0,	// ордината блока
	url		: '' 	// линк, по которому приложение загрузит функционал виджета
}, {
	colspan	: 1,
	rowspan	: 2,
	left	: 0,
	top		: 3,
	url		: ''
}, {
	colspan	: 2,
	rowspan	: 4,
	left	: 1,
	top		: 0,
	url		: ''
}, {
	colspan	: 1,
	rowspan	: 1,
	left	: 3,
	top		: 0,
	url		: ''
}];

})(jQuery);