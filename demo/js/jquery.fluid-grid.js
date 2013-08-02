/**
 *	Плагин, возвращающий "таблицу" с возможностью добавления перетаскиваемых блоков.
 *	Перетаскиваемый блок расталкивает остальные
 *
 *	Это концепт, много незаконченных функций, неоптимизированный функционал
 *	Chrome, FireFox 4+, Safari 5.1.4+, Opera 12+, IE 9+
 *	(для поддержки IE ниже 9 можно использовать расширения Array.prototype от Mozilla Foundation)
 *	Opera 10+ при наличии в вызывающем коде полифила для Function.prototype.bind
 *	
 *	@autor Бодров Андрей dagen-niger (mailto:dagen-niger@ya.ru)
 *	@require jQueryUI.draggable
 */

(function($, undefined) {

	var methods = {
		/**
		 * Инициализация плагина
		 * @param {object} opt объектный литерал с опциями, переданными при вызове плагина
		 */
		initialize : function(opt) { 
			var $this = $(this),
				data = $this.data('fluidGrid'),
				options = {},
				grid = {};
				
			if(data) { return } // плагин уже инициализирован, нечего процессор нагревать
			
			options = $.extend({
				columns	: 4, // количество колонок по-умолчанию
				rows	: 5, // количество рядов по-умолчанию
				width	: 235, // ширина минимальной ячейки
				height	: 100, // высота минимальное ячейки
				spacing : 10, // расстояние между ячейками (одинаковое по горизонтали и вертикали)
				_$this 	: $this
			}, opt)
			
			grid = new Grid(options);
			
			$(this).data('fluidGrid', {
               status 	: 'initialized',
               grid 	: grid
			});
		},

		destroy: function() {
			return this.each(function() {
				var $this = $(this),
					data = $this.data('fluidGrid');
				
				// запрос на уничтожение виджетов
				// виджеты могут содержать важные данные,
				// поэтому полное уничтожение таблицы после ответа виджетов (коллбек accepted)
				data.grid.closeQuery({
					accepted: function() {
						data.grid.destroy();
						$this.removeData('fluidGrid');
					},
					rejected: function() {
						alert('Пожалуйста, сохраните данные перед выходом.');
					}
				});
			})
		},
		
		/**
		 * Добавление блока в таблицу
		 * @param block параметры добавляемого блока
		 * @param then коллбек, вызываемый после добавления
		 */
		addBlock : function(block, then) {
			var options = $.extend({
				colspan	: 1,
				rowspan	: 1,
				left	: 2,
				top		: 3
			}, block);
			
			var $this = $(this),
				data = $this.data('fluidGrid');
				
			options.grid = data.grid;
			data.grid.addBlock(options, then);
		},
		
		/**
		 * Удаление блока из таблицы
		 * @param block параметры блока
		 */
		removeBlock : function(block) {
		
		}
	};

	$.fn.fluidGrid = function(method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.initialize.apply(this, arguments);
		} else {
			$.error('Метод с именем ' +  method + ' не существует для jQuery.fluidGrid');
		}
	}
	
	
	
	// класс Grid
	/**
	 * Класс, инкапсулирующий функционал таблицы
	 * @param options {object}
	 */
	Grid = function(options) {
		this.options = options;
		this.$html = options._$this;	
		this.blocks = []; // блоки
		this.backgrounds = []; // фоновые ячейки
		this.stateHistory = []; // стек состояний таблицы
		
		this.createInterface();
	}
	/**
	 * Запрос к блокам на уничтожение, положительный (accepted) результат только когда все виджеты подтвердили;
	 * rejected если хотя бы один виджет отказал (параметром вызывается массив с блоками, в которых отказали виджеты)
	 * @param callbacks: поля accepted и rejected с соответствующими названиям функциями
	 */
	Grid.prototype.closeQuery = function(callbacks) {
		this.blocks.forEach(function(block) {
			if(!block) { return }
			block.closeQuery();
		});
	}
	
	/**
	 * Создаёт собственно внешний вид таблицы
	 */
	Grid.prototype.createInterface = function() {
		var $html 	= this.$html,
			o 		= this.options,
			width 	= o.width,
			height 	= o.height,
			columns = o.columns,
			rows 	= o.rows,
			spacing = o.spacing;
	
		this.$html.css({
			'width'		: width * columns + spacing * (columns - 1) + 'px',
			'height'	: height * rows + spacing * (rows - 1) + 'px',
			'overflow'	: 'hidden',
			'position'	: 'relative'
		});
		
		// собираю фоновые ячейки
		for (i = 0; i < columns*rows; i++) {
			// если правый ряд, то отступ справа не надо делать
			var currentSpacingX = (i+1)%columns == 0 ? 0 : spacing,
				newBackCell = $('<div>', { 'class' : 'backgroundCell' })
					.css({
						width	: width + 'px',
						height	: height + 'px',
						margin  : '0 ' + currentSpacingX + 'px ' + spacing + 'px 0'
					})
					.appendTo($html)
					// фоновые ячейки помечаются как перетаскиваемые, но с запретом перетаскивания
					// чтобы плагин draggable делал прилипание к внутренним границам ячеек (при перетаскивании блоков)
					.draggable({
						cancel: '*'
					});
			this.backgrounds.push(newBackCell);
		}
	};
	
	/**
	 * Добавляет блок в таблицу
	 * @param options литерал с опциями добавляемого блока
	 * @param then коллбек, вызываемый после добавления
	 */
	Grid.prototype.addBlock = function(options, then) {
		this.blocks.push(new Block(options, then));
		// и сохраняю в стек состояний
		this.stateHistory.unshift(this.getCurrentState());
	};
	
	/**
	 * Проверяет таблицу на нестыковки после ресайза блока
	 * @param sender - изменённый блок
	 */
	Grid.prototype.blockResizeHandler = function(sender) {
		if(this.checkForReflow(sender)) {
			// получилось расположить - сохраняет новое состояние
			this.applyState(this.intermediateState, 'forced');
			this.stateHistory.unshift(this.intermediateState);
		} else {
			// откат к предыдущему состоянию
			this.applyState(this.stateHistory[0], 'forced');
			alert('Нет места для увеличения блока. Попробуйте сначала уменьшить другой блок.');
		}
	};
	
	/**
	 * Переводит таблицу в режим перетаскивания элемента
	 */
	Grid.prototype.startDragMode = function() {
		this.reflowSuccess = true;
		this.intermediateState = this.getCurrentState();
	};
	
	/**
	 * Событие перетаскивания внутреннего блока
	 * @param sender - перетаскиваемый Block
	 * @param event - браузерное событие перетаскивания
	 * @param ui - данные о блоке
	 */
	Grid.prototype.onBlockDrag = function(sender, event, ui) {	
	};
	
	/**
	 * Проверяет, надо ли располагать блоки заново
	 * при необходимости располагает
	 * @param sender - перетаскиваемый Block
	 * @param current - текущая проекция блока на сетку ячеек (неиспользуемое)
	 * @return boolean, получилось ли расположить (может ли такое состояние быть сохранённым)
	 */
	Grid.prototype.checkForReflow = function(sender, current) {
		var state = this.getCurrentState(),
			reflowResult = {};
		
		// проверить - если нет пересечений, то сразу вернуть true
		if(!this.isAnyCollisions(state) && !this.isAnyOverflows(state)) {
			this.reflowSuccess = true;
			this.intermediateState = state;
			return true
		}

		// иначе пытается раздвинуть блоки
		reflowResult = this.solvePuzzle(sender, current, state);
		this.reflowSuccess = reflowResult.success;
		if(reflowResult.success) {
			// сохраняется, чтобы после окончания перетаскивания отправить в стек состояний
			this.applyState(reflowResult.newState);
			this.intermediateState = reflowResult.newState;
		}
		return reflowResult.success
	}
	
	/**
	 * Пытается расположить блоки заново,
	 * отталкиваясь от текущего состояния перетаскиваемого блока
	 * @param sender - перетаскиваемый Block
	 * @param current - текущая проекция блока на сетку ячеек
	 * @param state - состояние (с пересечением, для которого старается перерасположить блоки)
	 * @return boolean, получилось ли расположить
	 */
	Grid.prototype.solvePuzzle = function(sender, current, state) {
		var newState = [],
			success = false,
			o 		= this.options,
			columns = o.columns,
			rows 	= o.rows;;
	
		// сортировка state по уменьшению площади блоков,	
		state.sort(function(a, b) {
			return (b.block.getYardage() - a.block.getYardage())
		});
		
		// sender вырезать и добавить сразу в newState
		// так как остальные блоки будут обтекать его
		state.forEach(function(projection, index) {
			if (projection.block.uid == sender.uid) {
				newState.push(state.splice(index, 1)[0]);
			}
		});
		
		// проверить вырезанный элемент на вылезание из сетки
		var p = newState[0],
			hOverflow = p.left + p.colspan - columns,
			vOverflow = p.top + p.rowspan - rows;
		
		if(hOverflow > 0) { p.left -= hOverflow }
		if(vOverflow > 0) { p.top  -= vOverflow }
		
		// попытка замостить сетку блоками в таком порядке
		// (брать по очереди блоки и располагать как можно ближе к текущему положению)
		// вернуть результат попытки
		success =  state.every(function(piece) {
			return this.tryAddToPuzzle(piece, newState);
		}, this);
		
		return {
			success	: success,
			newState: newState
		}
	};
	
	/**
	 * Событие перетаскивания внутреннего блока
	 * пареметры сетки берутся от текущего grid
	 * @param piece - проекция блока
	 * @param newState - состояние, в которое проекция будет пытаться добавляться
	 * @return boolean, получилось ли расположить
	 */
	Grid.prototype.tryAddToPuzzle = function(piece, newState) {
		var o 					= this.options,
			columnsAvailable 	= o.columns - piece.colspan,
			rowsAvailable 		= o.rows - piece.rowspan,
			success				= false;
		
		main: for(c = 0; c <= columnsAvailable; c++) {
			for(r = 0; r <= rowsAvailable; r++) {
				var newBlock = {
					block	: piece.block,
					colspan	: piece.colspan,
					rowspan	: piece.rowspan,
					left	: c,
					top		: r
				}
				// добавить newBlock (push)
				// проверить на пересечения
				newState.push(newBlock);
				if(this.isAnyCollisions(newState)) {
					// неудача, убираю блок и иду на следующую итерацию цикла
					newState.pop();
				} else {
					// нет коллизий, оставляю такой state и выхожу из циклов
					success = true;
					break main
				}
			}
		}
		return success
	};
	
	/**
	 * Проверяет блоки из переданного состояния на наличие пересечений
	 * @param state - состояние сетки (из стека состояний)
	 * @return boolean == true, когда есть пересечения
	 */
	Grid.prototype.isAnyCollisions = function(state) {
		var haveCollision = false,
			length = state.length,
			i, j;
			
		main: for(i = 0; i < length; i++) {
			for(j = 0; j < length; j++) {
				var p1 = state[i], // projection1
					p2 = state[j]; // projection2
					
				if (p1.block.uid == p2.block.uid) { continue }
				if (Block.prototype.isIntersected(p1, p2)) {
					haveCollision = true;
					break main;
				}
			}
		}	
		return haveCollision
	};
	
	/**
	 * Проверяет блоки из переданного состояния на наличие выходов за границу сетки
	 * @param state - состояние сетки (из стека состояний)
	 * @return boolean == true, когда есть выходы за границу
	 */
	Grid.prototype.isAnyOverflows = function(state) {
		var o 		= this.options,
			columns = o.columns,
			rows 	= o.rows;
			
		return state.some(function(p) {
			var horizontalOverflow = p.left + p.colspan > columns,
				verticalOverflow = p.top + p.rowspan > rows;
		
			return horizontalOverflow || verticalOverflow
		});
	};
	
	/**
	 * Переводит таблицу в обычный режим
	 * если reflow удачный - блок ставится на место плейсхолдера, сохраняется новое состояние грида в стек
	 * если reflow неудачный - восстанавливается последнее состояние из стека состояний
	 */
	Grid.prototype.stopDragMode = function() {
		if(this.reflowSuccess) {
			//this.stateHistory.unshift(this.getCurrentState());
			this.applyState(this.intermediateState, 'forced');
			this.stateHistory.unshift(this.intermediateState);
		} else {
			this.applyState(this.stateHistory.shift());
		}
	};
	
	/**
	 * Проходит по блокам и составляет их текущее состояние
	 * Используется для дальнешего анализа или отправки в стек состояний
	 * @return Array - массив проекций блоков
	 */
	Grid.prototype.getCurrentState = function() {
		return this.blocks.map(function(block) {
			return $.extend({}, block.getProjection(), { block: block });
		});
	};
	
	/**
	 * Применяет состояние к блокам
	 * @param state
	 * @param forsed при true изменяет состояние блока, а не только визуально передвигает
	 */
	Grid.prototype.applyState = function(state, forced) {
		state.forEach(function(p) {
			p.block.applyProjection(p, forced);
		});
	};
	
	/**
	 * Уничтожает таблицу и все добавленные в неё блоки
	 */
	Grid.prototype.destroy = function() {
		this.blocks.forEach(function(block) {
			if(!block) { return }
			block.destroy && block.destroy();
		});
		this.$html.empty();
	}
	// закончился класс Grid
	
	
	
	/**
	 * Счётчик в замыкании, инкрементируется на каждое создание блока
	 * для создания уникальных id (в пределах текущего плагина) блокам
	 */
	var idCounter = 0;
	
	/**
	 * Класс, инкапсулирующий функционал блока таблицы
	 * @param options параметры добавляемого блока
	 */
	Block = function(options, then) {
		this.uid = idCounter++;
		this.options = options;
		this.grid = options.grid;
	
		var gridOpt 		= this.grid.options,
			cellWidthEx		= gridOpt.width + gridOpt.spacing,
			cellHeightEx	= gridOpt.height + gridOpt.spacing;
			
		if (typeof then !== 'function') { then = function() {} }
	
		this.savedUi = {
			position: {
				left: options.left * cellWidthEx,
				top: options.top * cellHeightEx
			}
		};
		this.createInterface();
		this._initDraggable();
		this.loadWidget(then);
	}
	/**
	 * Создаёт интерфейс блока (не загружая интерфейс виджета, только подложка)
	 */
	Block.prototype.createInterface = function() {
		var o 			= this.options,
			blockOpts	= {
				left	: o.left,
				top		: o.top,
				colspan	: o.colspan,
				rowspan	: o.rowspan
			};
	
		this.$html = $('<div>', { 'class' : 'gridBlock' })
			.appendTo(this.grid.$html)
			.css({
				position	: 'absolute',
				opacity		: 1,
			});
			
		this.$placeholder = $('<div>', { 'class' : 'gridBlockPlaceholder' })
			.appendTo(this.grid.$html)
			.css({
				position	: 'absolute',
				display		: 'none'
			});
		
		this.update$Block(this.$html, blockOpts);
		this.update$Block(this.$placeholder, blockOpts);
	};
	
	/**
	 * Обновляет размер и положение (блока и плейсхолдера)
	 * @param options литерал с опциями, изменяются только те параметры, которые переданы в опциях
	 */
	Block.prototype.update$Block = function(element, options) {
		if(!element || !options) { return; }
		element.css(this.convertCellsToCss(options));
	};
	
	/**
	 * Преобразует параметры блока в вид для применения в .css() и .animate()
	 * @param options литерал с опциями, изменяются только те параметры, которые переданы в опциях
	 * @result css литерал объекта
	 */
	Block.prototype.convertCellsToCss = function(options) {
		var css 		= {},
			gridOpt 	= this.grid.options,
			cellWidth 	= gridOpt.width,
			cellHeight 	= gridOpt.height,
			cellSpacing = gridOpt.spacing;
		
		if(typeof options['left'] !== 'undefined') {
			css.left = (cellWidth + cellSpacing) * options['left'] + 'px';
		}
		if(typeof options['top'] !== 'undefined') {
			css.top = (cellHeight + cellSpacing) * options['top'] + 'px';
		}
		if(typeof options['colspan'] !== 'undefined') {
			css.width = options['colspan'] * cellWidth + (options['colspan'] - 1) * cellSpacing + 'px';
		}
		if(typeof options['rowspan'] !== 'undefined') {
			css.height = options['rowspan'] * cellHeight + (options['rowspan'] - 1) * cellSpacing + 'px';
		}
		return css
	};
	 
	/**
	 * Инициализирует возможность перетаскивания,
	 * добавляет обработчики событий
	 */
	Block.prototype._initDraggable = function() {
		var iniOpts = {
			containment		: 'parent',
			// revert сделан управляемым, в событии stop
			//revert			: true, 
			revertDuration	: 200,
			cursor			: "move",
			iframeFix		: true,
			opacity			: 0.8,
			snap			: true,
			snapMode		: "inner",
			zIndex			: 100,
			cancel			: '.button',
			
			// ui.originalPosition - позиция, с которой стартовал блок 
			// ui.position - текущая позиция. Обе позиции относительно родителя
			start			: this.start.bind(this),
			drag			: this.drag.bind(this),
			stop			: this.stop.bind(this)
		};
	
		this.$html.draggable(iniOpts);
	};
	
	/**
	 * Подсчитывает площадь блока, выраженную в минимальных ячейках
	 * @return int
	 */
	Block.prototype.getYardage = function() {
		return this.options.colspan * this.options.rowspan
	};
	
	/**
	 * Возвращает позицию, над которой находится блок (округляет с половины блоков)
	 * @return { left: x, top: y } литерал объекта с позицией, измеряется в ячейках
	 */
	Block.prototype.getProjection = function() {
		var x 			= this.savedUi.position.left,
			y 			= this.savedUi.position.top,
			gridOpt 	= this.grid.options,
			cellWidth 	= gridOpt.width,
			cellHeight 	= gridOpt.height,
			cellSpacing = gridOpt.spacing,
			o 			= this.options,
			colspan 	= o.colspan,
			rowspan 	= o.rowspan;
			
		return {
			left		: Math.round(x / (cellWidth + cellSpacing)),
			top 		: Math.round(y / (cellHeight + cellSpacing)),
			colspan		: colspan,
			rowspan 	: rowspan
		}
	};
	
	/**
	 * Перемещает блок согласно переданной проекции
	 * @param p проекция
	 * @param forced при == true обновить переменные состояния блока
	 * @return success
	 */
	Block.prototype.applyProjection = function(p, forced) {
		if (!this.dragging) {
			this.$html.stop().animate(this.convertCellsToCss(p), 200);
			this.$placeholder.stop().css(this.convertCellsToCss(p));
		}
		
		// усиленный режим - не только анимирую, а ещё обновляю состояние
		if (forced) {
			var gridOpt 	= this.grid.options,
				cellWidth 	= gridOpt.width,
				cellHeight 	= gridOpt.height,
				cellSpacing = gridOpt.spacing;
		
			this.savedUi = {
				position : {
					left: p.left * (cellWidth + cellSpacing),
					top: p.top * (cellHeight + cellSpacing)
				}
			}
			
			if (typeof p.colspan !== 'undefined') { this.options.colspan = p.colspan }
			if (typeof p.rowspan !== 'undefined') { this.options.rowspan = p.rowspan }
		}
	};
	
	/**
	 * Проверяет пересечение с другим блоком (на существующей сетке)
	 * @param block {Block}
	 * @return boolean == true, если есть пересечение блоков
	 */
	Block.prototype.checkCollisionWith = function(block) {
		var rect1 	= this.getProjection(),
			rect2 	= block.getProjection();
			
		return this.isIntersected(rect1, rect2)
	};
	
	/**
	 * Проверяет, если ли пересечение двух проекций (для вычисляемых состояний)
	 * @param p1 (projection1)
	 * @param p2 (projection2)
	 * @return boolean == true, если есть пересечение
	 */
	Block.prototype.isIntersected = function(p1, p2) {
		// нахожу минимальный прямоугольник, описанный вокруг двух исходных пр-ков
		var	minX  	= Math.min(p1.left	, p2.left),
			minY  	= Math.min(p1.top	, p2.top),
			maxX  	= Math.max(p1.left 	+ p1.colspan, p2.left 	+ p2.colspan),
			maxY  	= Math.max(p1.top 	+ p1.rowspan, p2.top 	+ p2.rowspan),
			width 	= maxX - minX,
			height 	= maxY - minY,
			
			sumCols = p1.colspan + p2.colspan, // сумма ширин
			sumRows = p1.rowspan + p2.rowspan; // сумма длинн
			
		// если сумма ширин обоих пр-ков больше ширины описанного
		// и при этом аналогично с суммой ширин -
		// то прямоугольники пересекаются
		return (sumCols > width) && (sumRows > height);
	};
	
	/**
	 * Событие старта перетаскивания блока
	 * @param event {Event} браузерный объект события
	 * @param ui {Object} информация о текущем блоке
	 */
	Block.prototype.start = function(event, ui) {
		// перевести сетку в режим изменения
		// показать плейсхолдер
		var grid = this.grid;
		
		this.dragging = true;
		this.savedUi = ui;
		this.savedProjection = this.getProjection();
		this.$placeholder.show();
		
		grid.startDragMode();
		//this.$placeholder.toggle(grid.tryReflow(this, event, ui));
	};
	
	/**
	 * Событие перетаскивания блока
	 * @param event {Event} браузерный объект события
	 * @param ui {Object} информация о текущем блоке
	 */
	Block.prototype.drag = function(event, ui) {
		// при изменении целевого блока плейсхолдера - вызов reflow сетки
		// если рефлоу удачный - показать плейсхолдер, иначе скрыть его
		var grid = this.grid;
			saved = this.savedProjection,
			current = this.getProjection(); // currentProjection
		
		this.dragging = true;
		this.savedUi = ui;	
		grid.onBlockDrag(this, event, ui);
		
		// сравнить проекции, если отличаются - вызвать рефлоу и перерисовку плейсхолдера
		if(saved.left != current.left || saved.top != current.top) {
			// обновляю текущую проекцию и перерисовываю плейсхолдер
			this.savedProjection = current;
			this.update$Block(this.$placeholder, {
				left	: current.left,
				top		: current.top
			});
			this.$placeholder.toggle(grid.checkForReflow(this, current));
		}
	};
	
	/**
	 * Событие окончания перетаскивания блока
	 * @param event - браузерный объект события
	 * @param ui - информация о текущем блоке
	 */
	Block.prototype.stop = function(event, ui) {
		// убрать плейсхолдер,
		// перевести сетку в обычный режим
		this.dragging = false;
		this.savedUi = ui;
		this.grid.stopDragMode();
		this.$placeholder.hide();
		this.$html.css({ opacity: 1 });
	};
	
	/**
	 * Ресайзит блок до указанного размера
	 * @param colspan - ширина (в базовых ячейках сетки)
	 * @param rowspan - высота
	 */
	Block.prototype.switchSize = function(colspan, rowspan) {
		var o = this.options;
		
		// отмена переключения, если уже такой размер
		if (o.colspan == colspan && o.rowspan == rowspan) { return }
		
		o.colspan = colspan;
		o.rowspan = rowspan;
		this.grid.blockResizeHandler(this);
	};
	
	
	/**
	 * Загружает виджет
	 * вызов не обязателен, можно работать непосредственно с htmlNode
	 * @param then - коллбек, вызываемый при окончании загрузки
	 */
	Block.prototype.loadWidget = function(then) {
		if(typeof then === 'function') { then(this); }
	};
	
	/**
	 * Уничтожает блок
	 */
	Block.prototype.destroy = function() {
		// todo
	};

})(jQuery);