var hash = require("./hash");
var sprintf = require('sprintf').sprintf;
var _ = require('underscore')._;

/**
 * PrecisionRecall - an object for tracking results of experiments: precision, recall, f1, and execution time.
 * 
 * @author Erel Segal-haLevi
 * @since 2013-06
 */
console.vlog = function(data) { fs.appendFileSync(log_file, data + '\n', 'utf8') };

var PrecisionRecall = function() {
	this.labels = {}
	this.intents = {}
	this.confusion = {} // only in single label case

	this.confusion_intents = {} // only in single label case
	
	this.count = 0;
	this.TRUE = 0;
	this.startTime = new Date();
}

PrecisionRecall.prototype = {
		
	/**
	 * Record the result of a new binary experiment.
	 * 
	 * @param expected - the expected result (true/false).
	 * @param actual   - the actual   result (true/false).
	 */
	addCase: function(expected, actual) {
		this.count++;
		if (expected && actual) this.TP++;
		if (!expected && actual) this.FP++;
		if (expected && !actual) this.FN++;
		if (!expected && !actual) this.TN++;
		if (expected==actual) this.TRUE++;
	},

	/**
	 * Record the result of a new classes experiment.
	 *
	 * @param expectedClasses - the expected set of classes (as an array or a hash).
	 * @param actualClasses   - the actual   set of classes (as an array or a hash).
	 * @param logTruePositives- if true, log the true positives. 
	 * @return an array of explanations "FALSE POSITIVE", "FALSE NEGATIVE", and maybe also "TRUE POSITIVE"
	 */
	addCases: function (expectedClasses, actualClasses, logTruePositives) {
		var explanations = [];
		actualClasses = hash.normalized(actualClasses);
		expectedClasses = hash.normalized(expectedClasses);

		var allTrue = true;
		for (var actualClass in actualClasses) {
			if (actualClass in expectedClasses) { 
				if (logTruePositives) explanations.push("\t\t+++ TRUE POSITIVE: "+actualClass);
				this.TP++;
			} else {
				explanations.push("\t\t--- FALSE POSITIVE: "+actualClass);
				this.FP++;
				allTrue = false;
			}
		}
		for (var expectedClass in expectedClasses) {
			if (!(expectedClass in actualClasses)) {
				explanations.push("\t\t--- FALSE NEGATIVE: "+expectedClass);
				this.FN++;
				allTrue = false;
			}
		}
		if (allTrue) {
			if (logTruePositives) explanations.push("\t\t*** ALL TRUE!");
			this.TRUE++;
		}
		this.count++;
		return explanations;
	},

/**
	 * Record the result of a new classes experiment in a hash manner.
	 * Doesn't allowed to do a inner output, all stats are put in hash
	 * @param expectedClasses - the expected set of classes (as an array or a hash).
	 * @param actualClasses   - the actual   set of classes (as an array or a hash).
	 * @param logTruePositives- if true, log the true positives. 
	 * @return an array of explanations "FALSE POSITIVE", "FALSE NEGATIVE", and maybe also "TRUE POSITIVE"
     * @author Vasily Konovalov
	 */

	addIntentHash: function (expectedClasses, actualClasses, logTruePositives ) {
		actualClasses = _.compact(actualClasses);
		expectedClasses = _.compact(expectedClasses);
	//	actualClasses = hash.normalized(actualClasses);
	//	expectedClasses = hash.normalized(expectedClasses);

	//	var actualIntents = _.unique(_.map(_.keys(actualClasses), function(klas){ return _.keys(JSON.parse(klas))[0] }))
	//	var expectedIntents = _.unique(_.map(_.keys(expectedClasses), function(klas){ return _.keys(JSON.parse(klas))[0] }))
	
        var actualIntents = _.unique(actualClasses)
        var expectedIntents = _.unique(expectedClasses)

	console.vlog("DEBUGEVAL: addIntentHash: actualIntents: "+JSON.stringify(actualIntents))
	console.vlog("DEBUGEVAL: addIntentHash: expectedIntents: "+JSON.stringify(expectedIntents))
       
     	if (expectedIntents.length == 1)
		{
			var expected = expectedIntents[0]
			if (!(expected in this.confusion_intents))
					this.confusion_intents[expected] = {}

			_.each(actualIntents, function(actualClass, key, list){
				if (!(actualClass in this.confusion_intents[expected]))
					this.confusion_intents[expected][actualClass] = 0

				this.confusion_intents[expected][actualClass] +=1
			}, this)
		}

		actualIntents = hash.normalized(actualIntents);
		expectedIntents = hash.normalized(expectedIntents);

		for (var actualIntent in actualIntents) {

			if (!(actualIntent in this.intents)) {
				this.intents[actualIntent]={}
				this.intents[actualIntent]['TP']=0; this.intents[actualIntent]['FP']=0; this.intents[actualIntent]['FN']=0
				}

			if (actualIntent in expectedIntents)
				this.intents[actualIntent]['TP'] += 1 
			else
				this.intents[actualIntent]['FP'] += 1
		}
		
		for (var expectedIntent in expectedIntents) {

			if (!(expectedIntent in this.intents)) {
				this.intents[expectedIntent]={}
				this.intents[expectedIntent]['TP']=0; this.intents[expectedIntent]['FP']=0; this.intents[expectedIntent]['FN']=0
				}

			if (!(expectedIntent in actualIntents))
				this.intents[expectedIntent]['FN'] += 1 
		}
	
		console.vlog("DEBUGEVAL: addIntentHash: intents: "+JSON.stringify(this.intents, null, 4))
	},

	addCasesHash: function (expectedClasses, actualClasses, logTruePositives ) {
		
		actualClasses = _.compact(actualClasses);
                expectedClasses = _.compact(expectedClasses);


		var explanations = {};
		explanations['TP'] = []; explanations['FP'] = []; explanations['FN'] = [];

		if (expectedClasses.length == 1)
		{
			var expected = expectedClasses[0]
			if (!(expected in this.confusion))
					this.confusion[expected] = {}
			_.each(actualClasses, function(actualClass, key, list){
				if (!(actualClass in this.confusion[expected]))
					this.confusion[expected][actualClass] = 0
				this.confusion[expected][actualClass] +=1
			}, this)
		}

		actualClasses = hash.normalized(actualClasses);
		expectedClasses = hash.normalized(expectedClasses);
		
		console.vlog("DEBUGEVAL: addCasesHash: actualClasses: "+JSON.stringify(actualClasses))
		console.vlog("DEBUGEVAL: addCasesHash: expectedClasses: "+JSON.stringify(expectedClasses))

		var allTrue = true;
		for (var actualClass in actualClasses) {

			if (!(actualClass in this.labels)) {
				this.labels[actualClass]={}
				this.labels[actualClass]['TP']=0
				this.labels[actualClass]['FP']=0
				this.labels[actualClass]['FN']=0
				}

			if (actualClass in expectedClasses) { 
				if (logTruePositives) explanations['TP'].push(actualClass);
				this.labels[actualClass]['TP'] += 1 
				// this.TP++;
			} else {
				explanations['FP'].push(actualClass);
				this.labels[actualClass]['FP'] += 1
				// this.FP++;
				allTrue = false;
			}
		}
		for (var expectedClass in expectedClasses) {

			if (!(expectedClass in this.labels)) {
				this.labels[expectedClass]={}
				this.labels[expectedClass]['TP']=0
				this.labels[expectedClass]['FP']=0
				this.labels[expectedClass]['FN']=0
				}

			if (!(expectedClass in actualClasses)) {
				explanations['FN'].push(expectedClass);
				this.labels[expectedClass]['FN'] += 1 
				// this.FN++;
				allTrue = false;
			}
		}
		if (allTrue) {
			// if ((logTruePositives)&& (!only_false_cases)) explanations.push("\t\t*** ALL TRUE!");
			this.TRUE++;
		}
		this.count++;

		_.each(explanations, function(value, key, list){ 
			// explanations[key] = _.sortBy(explanations[key], function(num){ num });
			explanations[key].sort()
		}, this)

		if (explanations['FP'].length == 0)
			delete explanations['FP']

		if (explanations['FN'].length == 0)
			delete explanations['FN']

                console.vlog("DEBUGEVAL: addCasesHash: explanations: "+JSON.stringify(explanations))

		return explanations;
	},

	retrieveLabels: function()
	{
		_.each(Object.keys(this.labels), function(label, key, list){ 
			
			this.labels[label]['Recall'] = this.labels[label]['TP'] / (this.labels[label]['TP'] + this.labels[label]['FN']);
			this.labels[label]['Precision'] = this.labels[label]['TP'] / (this.labels[label]['TP'] + this.labels[label]['FP']);
			this.labels[label]['F1'] = 2 / (1/this.labels[label]['Recall'] + 1/this.labels[label]['Precision'])

			// if (!this.labels[label]['F1']) this.labels[label]['F1'] = -1
		}, this)

		// var reduced = {}

		// // reduce the labels into intents 
		// _.each(Object.keys(this.labels), function(label, key, list){ 
		// 	if (JSON.parse(label))
		// 	{
		// 		var intent = _.keys(JSON.parse(label))[0]
		// 		if (!(intent in this.reduced))
		// 			this.reduced[intent] = {'TP':0, 'FP':0, 'FN':0}

		// 		this.reduced[intent]['TP'] += this.labels[label]['TP']
		// 		this.reduced[intent]['FP'] += this.labels[label]['FP']
		// 		this.reduced[intent]['FN'] += this.labels[label]['FN']

		// 	}
		// }, this)

		// // calculate Precision Recall F1
		// _.each(this.reduced, function(value, key, list){
		// 	this.reduced[key]['Recall'] = this.reduced[key]['TP'] / (this.reduced[key]['TP'] + this.reduced[key]['FN']);
		// 	this.reduced[key]['Precision'] = this.reduced[key]['TP'] / (this.reduced[key]['TP'] + this.reduced[key]['FP']);
		// 	this.reduced[key]['F1'] = 2 / (1/this.reduced[key]['Recall'] + 1/this.reduced[key]['Precision'])
		// }, this)

		var arlabels = _.pairs(this.labels) 
		arlabels = _.sortBy(arlabels, function(num){ return arlabels[0] })
		this.labels = _.object(arlabels)

		return this.labels
	},

	calculateStats: function()
	{
		var stats = {}
		var temp_stats = {}
		
		this.retrieveLabels()
		
		console.vlog("DEBUGEVAL: labels: "+ JSON.stringify(this.labels, null, 4))

		var labelsstats = _.values(this.labels)

		_.each(['Precision', 'Recall', 'F1'], function(param, key, list){ 

			temp_stats[param] = _.pluck(labelsstats, param)

			console.vlog("DEBUGEVAL: temp_stats: param: "+param+" plucked: "+ JSON.stringify(temp_stats[param], null, 4))
			// temp_stats[param] = _.filter(temp_stats[param], function(elem){ return (!_.isNaN(elem) && !_.isNull(elem) && elem>-1)  })
			// temp_stats[param] = _.reduce(temp_stats[param], function(memo, num){ if (!_.isNaN(num) && !_.isNull(num) && num>-1) {return (memo + num)} else return memo }) / temp_stats[param].length
			temp_stats[param] = _.reduce(temp_stats[param], function(memo, num){ if (!_.isNaN(num)) {return (memo + num)} else return memo }, 0) / temp_stats[param].length
		})
	
		console.vlog("DEBUGEVAL: temp_stats: "+ JSON.stringify(temp_stats, null, 4))

		_.each(['TP', 'FP', 'FN'], function(param, key, list){ 
			stats[param] = _.pluck(labelsstats, param)
			stats[param] = _.reduce(stats[param], function(memo, num){ return memo + num })
		})


		console.vlog("DEBUGEVAL: INTENTS: "+ JSON.stringify(this.intents, null, 4))

		_.each(this.intents, function(value, key, list){
			this.intents[key]["Recall"] = this.intents[key]['TP']/(this.intents[key]['TP']+this.intents[key]['FN'])
			// if (_.isNull(this.intents[key]["Recall"]) || _.isUndefined(this.intents[key]["Recall"]) || _.isNaN(this.intents[key]["Recall"])) delete this.intents[key]["Recall"]

			this.intents[key]["Precision"] = this.intents[key]['TP']/(this.intents[key]['TP']+this.intents[key]['FP'])
			// if (_.isNull(this.intents[key]["Precision"]) || _.isUndefined(this.intents[key]["Precision"]) || _.isNaN(this.intents[key]["Precision"])) delete this.intents[key]["Precision"]

			this.intents[key]["F1"] = 2*this.intents[key]['TP'] / (2*this.intents[key]['TP']+this.intents[key]['FP']+this.intents[key]['FN'])
			// this.intents[key]["F1"] = 2 / (1/this.intents[key]["Recall"] + 1/this.intents[key]["Precision"])

			// if (_.isNull(this.intents[key]["F1"]) || _.isUndefined(this.intents[key]["F1"]) || _.isNaN(this.intents[key]["F1"])) delete this.intents[key]["F1"]

			this[key+"_TP"] = this.intents[key]['TP'] 
			this[key+"_FP"] = this.intents[key]['FP']
			this[key+"_FN"] = this.intents[key]['FN']

			/*if ("Recall" in this.intents[key]) this[key+"_Recall"] = this.intents[key]['Recall']
			if ("Precision" in this.intents[key]) this[key+"_Precision"] = this.intents[key]['Precision']
			if ("F1" in this.intents[key]) this[key+"_F1"] = this.intents[key]['F1']*/
			this[key+"_Recall"] = this.intents[key]['Recall']
			this[key+"_Precision"] = this.intents[key]['Precision']
			this[key+"_F1"] = this.intents[key]['F1']
		}, this)

		this["macro-F1-intents"] = _.reduce(_.values(this.intents), function(memo, num){ return memo + num['F1']; }, 0)/_.values(this.intents).length

		var sumTPs = _.reduce(_.values(this.intents), function(memo, num){ return memo + num['TP']; }, 0)
		var sumFPs = _.reduce(_.values(this.intents), function(memo, num){ return memo + num['FP']; }, 0)
		var sumFNs = _.reduce(_.values(this.intents), function(memo, num){ return memo + num['FN']; }, 0)
		this["micro-Precision-intents"] = sumTPs/(sumTPs + sumFPs)
		this["micro-Recall-intents"] = sumTPs/(sumTPs + sumFNs)
		this["micro-F1-intents"] = 2 / (1/this["micro-Recall-intents"] + 1/this["micro-Precision-intents"])

		this.endTime = new Date();
		this.timeMillis = this.endTime-this.startTime;
		this.timePerSampleMillis = this.timeMillis / this.count;
		this.TP = stats.TP
		this.FP = stats.FP
		this.FN = stats.FN
		this.Accuracy = (this.TRUE) / (this.count);
		this["macro-Precision"] = temp_stats['Precision']
		this["macro-Recall"] = temp_stats['Recall']
		this["macro-F1"] = temp_stats['F1']
		this["micro-Precision"] = stats.TP / (stats.TP+stats.FP);
		this["micro-Recall"] = stats.TP / (stats.TP+stats.FN);
		this["micro-F1"] = 2 / (1/this["micro-Recall"] + 1/this["micro-Precision"]);
		this.HammingLoss = (stats.FN+stats.FP) / (stats.FN+stats.TP); // "the percentage of the wrong labels to the total number of labels"
		this.HammingGain = 1-this.HammingLoss;
		
		// this.shortStatsString = sprintf("Accuracy=%d/%d=%1.0f%% HammingGain=1-%d/%d=%1.0f%% Precision=%1.0f%% Recall=%1.0f%% F1=%1.0f%% timePerSample=%1.0f[ms]",
				// this.TRUE, this.count, this.Accuracy*100, (this.FN+this.FP), (this.FN+this.TP), this.HammingGain*100, this.Precision*100, this.Recall*100, this.F1*100, this.timePerSampleMillis);
		
		// _.each(this.labels, function(st, lab, list){ 
		// 	_.each(st, function(val, par, list){ 
		// 		stats[lab+"_"+par] = val
		// 	}, this)
		// }, this)

		// return stats
	}
}

module.exports = PrecisionRecall;


// example of usage see in test
	// addCasesHashSeq: function (expectedClasses, actualClasses, logTruePositives ) {

	// 	var ex = []
	// 	var ac = []
	// 	var matchlist = []

	// 	// clean up expected list
	// 	_.each(expectedClasses, function(expected, key, list){ 
	// 		if ((expected.length == 2) || (expected.length == 3))
	// 			ex.push(expected)
	// 	}, this)

	// 	// ac = actualClasses
	// 	// // filtering actual classes		
	// 	// _.each(actualClasses, function(actual, key, list){ 
	// 	// 	var found = _.filter(ac, function(num){ return ((num[0] == actual[0]) && (this.intersection(num[1], actual[1]) == true)) }, this);
	// 	// 	if (found.length == 0)
	// 	// 		ac.push(actual)
	// 	// }, this)

	// 	// console.log(JSON.stringify(actualClasses, null, 4))

	// 	// var ac = this.uniquecandidate(this.uniqueaggregate(actualClasses))
	// 	var ac = actualClasses


	// 	// filling interdependencies between labels 
	// 	// for every candidate (actual) it looks for intersection between actual labels with different 
	// 	// intents, intersection means that different intents came to the common substring, then arrange 
	// 	// all the data in the hash, and mention only keyphrases.

	// 	_.each(ac, function(actual, key, list){
	// 	if (actual.length > 3)
	// 		{	 
	// 		label = actual[0]
	// 		// keyphrase
	// 		str = actual[2]
	// 		if (!(label in this.dep))
	// 			{
	// 			this.dep[label] = {}
	// 			this.dep[label][label] = []
	// 			}
	// 		this.dep[label][label].push(str)

	// 		// intersection, different intents but actual intersection
	// 		var found = _.filter(ac, function(num){ return ((num[0] != actual[0]) && (this.intersection(num[1], actual[1]) == true)) }, this);
	// 		_.each(found, function(sublabel, key, list){
	// 			if (!(sublabel[0] in this.dep[label]))
	// 				this.dep[label][sublabel[0]] = []
	// 			this.dep[label][sublabel[0]].push([[actual[2],actual[4]], [sublabel[2],sublabel[4]]])
	// 		}, this)
	// 		}
	// 	}, this)

	// 	var explanations = {};
	// 	explanations['TP'] = []; explanations['FP'] = []; explanations['FN'] = [];
		
	// 	var explanations_detail = {};
	// 	explanations_detail['TP'] = []; explanations_detail['FP'] = []; explanations_detail['FN'] = [];
		
	// 	var allTrue = true;
	// 	for (var actualClassindex in ac) {
			
	// 		if (!(ac[actualClassindex][0] in this.labels)) {
	// 			this.labels[ac[actualClassindex][0]]={}
	// 			this.labels[ac[actualClassindex][0]]['TP']=0
	// 			this.labels[ac[actualClassindex][0]]['FP']=0
	// 			this.labels[ac[actualClassindex][0]]['FN']=0
	// 			}

	// 		var found = false
	// 		_.each(ex, function(exc, key, list){
	// 			if (ac[actualClassindex][0] == exc[0])
	// 				{
	// 				if ((exc[1].length == 0) || (ac[actualClassindex][1][0] == -1))
	// 					{
	// 					found = true
	// 					matchlist.push(ac[actualClassindex])
	// 					}
	// 				else
	// 					{
	// 					if (this.intersection(ac[actualClassindex][1], exc[1]))
	// 						{
	// 						found = true
	// 						matchlist.push(ac[actualClassindex])
	// 						}
	// 					}
	// 				}
	// 		}, this)

	// 		if (found) { 
	// 			if (logTruePositives)
	// 				{
	// 					explanations['TP'].push(ac[actualClassindex][0]);
	// 					explanations_detail['TP'].push(ac[actualClassindex]);
	// 					this.labels[ac[actualClassindex][0]]['TP'] += 1
	// 					this.TP++
	// 				}
	// 		} else {
	// 			explanations['FP'].push(ac[actualClassindex][0]);
	// 			explanations_detail['FP'].push(ac[actualClassindex]);
	// 			this.labels[ac[actualClassindex][0]]['FP'] += 1
	// 			this.FP++
	// 			allTrue = false;
	// 		}
	// 	}

	// 	for (var expectedClassindex in ex) {
	// 		var found = false

	// 		if (!(ex[expectedClassindex][0] in this.labels)) {
	// 			this.labels[ex[expectedClassindex][0]]={}
	// 			this.labels[ex[expectedClassindex][0]]['TP']=0
	// 			this.labels[ex[expectedClassindex][0]]['FP']=0
	// 			this.labels[ex[expectedClassindex][0]]['FN']=0
	// 			}

	// 		_.each(ac, function(acc, key, list){ 
	// 			if (ex[expectedClassindex][0] == acc[0])
	// 				{
	// 					if ((ex[expectedClassindex][1].length == 0) || (acc[1][0] == -1))
	// 						found = true
	// 					else
	// 						{
	// 						if (this.intersection(ex[expectedClassindex][1], acc[1]))
	// 							found = true
	// 						}
	// 				}
	// 		}, this)

	// 		if (!found)
	// 			{
	// 			explanations['FN'].push(ex[expectedClassindex][0]);
	// 			explanations_detail['FN'].push(ex[expectedClassindex]);
	// 			this.labels[ex[expectedClassindex][0]]['FN'] += 1
	// 			this.FN++;
	// 			allTrue = false;
	// 			}
	// 	}

	// 	if (allTrue) {
	// 		// if ((logTruePositives)&& (!only_false_cases)) explanations.push("\t\t*** ALL TRUE!");
	// 		this.TRUE++;
	// 	}
	// 	this.count++;

	// 	// _.each(explanations, function(value, key, list){ 
	// 		// explanations[key] = _.sortBy(explanations[key], function(num){ num });
	// 		// explanations[key].sort()
	// 	// }, this)

	// 	// console.log(explanations)
	// 	// console.log(matchlist)
		
	// 	// if (expectedClasses.length > 1)
	// 		// process.exit(0)

	// 	return {
	// 			'explanations': explanations,
	// 			'match': matchlist,
	// 			'explanations_detail': explanations_detail
	// 			}
	// },

	// simple intersection
	// intersection:function(begin, end)
	// {
	// 	if ((begin[0]<=end[0])&&(begin[1]>=end[0]))
	// 		return true
	// 	if ((begin[0]>=end[0])&&(begin[0]<=end[1]))
	// 		return true
	// 	return false
	// },
	
