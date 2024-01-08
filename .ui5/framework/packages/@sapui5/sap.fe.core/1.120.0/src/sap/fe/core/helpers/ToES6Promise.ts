/**
 * Transforms a jQuery promise into a regular ES6/TS promise.
 *
 * @param oThenable The jQueryPromise
 * @returns The corresponding ES6 Promise
 */
function toES6Promise(oThenable: any): Promise<any> {
	return new Promise((resolve, reject) => {
		oThenable
			.then(function (...args: any[]) {
				resolve(Array.prototype.slice.call(args));
			})
			.catch(function (...args: any[]) {
				reject(Array.prototype.slice.call(args));
			});
	});
}

export default toES6Promise;
