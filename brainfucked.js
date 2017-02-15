
this.Brainfucked = {
	self: null,
	_currentExec: null,
	
	stdoutElement: null,
	
	init: function() {
		// create ace
		Brainfucked.editor = ace.edit("editor");
		var editor = this.editor;
		var session = this.editor.session;
		
		editor.setTheme("ace/theme/tomorrow_night");
		
		var HaskellMode = ace.require("ace/mode/haskell").Mode;
		session.setMode(new HaskellMode());
		
		// autofocus
		editor.focus();
		
		// default editor options
		session.setTabSize(4);
		session.setUseSoftTabs(false);
		
		// bind buttons
		$("#runbutton").click(Brainfucked.doRun);
		
		// find console
		Brainfucked.stdoutElement = $("#console")[0];
	},
	
	doRun: function() {
		// clear console
		Brainfucked.stdoutElement.value = "";
		
		// log
		console.log("run");
		Brainfucked.stdoutElement.value += "[run : " + performance.now() + "]\n";
		
		// get code
		var code = Brainfucked.editor.session.getValue();
		
		// execute
		execution = new Brainfucked.Execution(code);
		Brainfucked._currentExec = execution;
		
		Brainfucked.Interpreter.execute(execution);
		
		// log
		Brainfucked.stdoutElement.value += "[finished : " + performance.now() + "]\n";
	},
};


/** static Interpreter */
Brainfucked.Interpreter = {
	
	execute: function(execution) {
		while(execution.programcounter < execution.code.length) {
			var inst = execution.inst(execution.programcounter);
			this._processInstruction(execution, inst);
		}
	},
	
	/** implementation is (hopefully) fully spec compliant */
	_processInstruction(execution, inst) {
		var skipCounterIncr = false;
		
		switch(inst) {
			case '>': execution.datapointer++; break;
			case '<': execution.datapointer--; break;
			case '+': execution.incrByte(execution.datapointer); break;
			case '-': execution.decrByte(execution.datapointer); break;
			case '.': this._printByte(execution.getByte(execution.datapointer)); break;
			case ',': execution.setByte(execution.datapointer, this._fetchInputByte()); break;
			case '[': if(execution.getByte(execution.datapointer) === 0) execution.programcounter = this._findMatchingBracket(execution, execution.programcounter, false); break;
			case ']': if(execution.getByte(execution.datapointer) !== 0) execution.programcounter = this._findMatchingBracket(execution, execution.programcounter, true); break;
			default: break; // ignore invalid instructions
		}
		
		// increment pc
		if(!skipCounterIncr) execution.programcounter++;
	},
	
	_findMatchingBracket: function(execution, from, backwards) {
		var indent = 0;
		var counter = from + (backwards ? -1 : 1);
		
		while(counter >= 0 && counter < execution.code.length) {
			var inst = execution.inst(counter);
			
			switch(inst) {
				case '[':
					if(indent === 0 && backwards) return counter;
					(backwards ? indent-- : indent++);
					break;
				case ']':
					if(indent === 0 && !backwards) return counter;
					(backwards ? indent++ : indent--);
					break;
			}
			
			// incr programcounter
			(backwards ? counter-- : counter++);
		}
		return (backwards ? 0 : execution.code.length-1);
	},
	
	_fetchInputByte: function() {
		// DEBUG:
		return 0;
	},
	
	_printByte: function(val) {
		Brainfucked.stdoutElement.value += String.fromCharCode(val);
		//console.log(String.fromCharCode(val));
	},
};


/** class Execution */
Brainfucked.Execution = function(code) {
	this.code = code;
	
	this._dataPos = new Uint8Array(256);
	this._dataNeg = new Uint8Array(256);
};
Brainfucked.Execution.prototype = {
	code: null,
	
	_dataPos: null,
	_dataNeg: null,
	
	programcounter: 0,
	datapointer: 0,
	
	inst: function(counter) {
		return this.code.charAt(counter);
	},
	
	getByte: function(pointer) {
		return (pointer >= 0 ? this._dataPos[pointer] : this._dataNeg[-pointer - 1]);
	},
	setByte: function(pointer, val) {
		(pointer >= 0 ? this._dataPos[pointer] = val : this._dataNeg[-pointer - 1] = val);
	},
	incrByte: function(pointer) {
		(pointer >= 0 ? this._dataPos[pointer]++ : this._dataNeg[-pointer - 1]++);
	},
	decrByte: function(pointer) {
		(pointer >= 0 ? this._dataPos[pointer]-- : this._dataNeg[-pointer - 1]--);
	},
};


$(function() {
	Brainfucked.init();
});
