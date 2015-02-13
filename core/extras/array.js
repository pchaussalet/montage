// To just removing one item, this one 
//    will be way faster :
//Second argument is to help when an array's length is managed on the side for optimization reasons
Object.defineProperty(Array.prototype, "spliceOne", {
    value: function(index,length) {
           var len= arguments.length === 2 ? length : this.length;
           if (!len) { return }
           while (index<len) { 
                 this[index] = this[index+1]; 
				index++ 
			}
           return  arguments.length === 2 ? --length : this.length--;
	},
    writable: true,
    configurable: true
});
