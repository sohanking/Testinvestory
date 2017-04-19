// app/routes.js

var cookieParser = require('cookie-parser');
var session = require('express-session')
var nodemailer = require('nodemailer');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var async = require('async');
var http = require('http');
var soap = require('soap');
var parseString = require('xml2js').parseString;
var Zendesk = require('zendesk-node-api');
var User = require('../app/models/user');
var Profile = require('../app/models/profile');
var Portfolio = require('../app/models/portfolio');
var Payment = require('../app/models/schemepayment');
var wellknown = require('nodemailer-wellknown');
var useragent = require('express-useragent');
var crypto = require('crypto');
var request = require("request");
var pg = require('pg');

function mail(from, to, subject, text) {
	var api_key = 'key-cd53eadfa9793e5786ddbdf759cf0c44';
	var domain = 'sandbox36a9c8afddc44d2781db5e3780497211.mailgun.org';
	var mailgun = require('mailgun-js')({ apiKey: api_key, domain: domain });
	var data = {
		from: from,
		to: to,
		subject: subject,
		text: text
	};
	mailgun.messages().send(data, function (error, body) {
		console.log(body);
	});
}

function renewalDate(days, oldDate) {
	var split1 = oldDate.split(' ');
	var split2 = split1[0].split('-');
	var newDate = new Date(split2[0] + '-' + split2[1] + '-' + split2[2]);
	newDate.setDate(newDate.getDate() + days);
	return newDate;
}

function checksum(str, algorithm, encoding) {
	return crypto
		.createHash(algorithm)
		.update(str, 'utf8')
		.digest(encoding || 'hex')
}

function getTransactionID(userid) {
	var date = new Date();
	var hour = date.getHours();
	hour = (hour < 10 ? "0" : "") + hour;
	var min = date.getMinutes();
	min = (min < 10 ? "0" : "") + min;
	var sec = date.getSeconds();
	sec = (sec < 10 ? "0" : "") + sec;
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	month = (month < 10 ? "0" : "") + month;
	var day = date.getDate();
	day = (day < 10 ? "0" : "") + day;
	console.log("in gettxn" + sec);
	return year + month + day + hour + min + sec + userid;
}

//var conString = "postgres://user1:12345@localhost:5432/investorydb";

var conString = "postgres://postgres:postgres@localhost:5432/investory";

var client = new pg.Client(conString);
client.connect();

module.exports = function (app, passport) {
	function checkPan(req) {
		if (req.session.panMessage) {
			return true;
		} else {
			return false;
		}
	}
	function checkLoginStatus(req) {
		if (req.session.loggedIn) {
			return true;
		} else {
			return false;
		}
	}
	/* bot = req.useragent["isBot"]
	desktop =req.useragent["isDesktop"]
	myBrowser = req.useragent["browser"]
	myVesrion = req.useragent["version"]
	myOs = req.useragent["os"]
	myPlatform = req.useragent["platform"]
	mySource = req.useragent["source"]
	*/
	function checkPaymentStatus(req) {
		console.log(req.session.payment + "checkStatus");
		if (req.session.payment) {
			return true;
		}
		else {
			return false;
		}
	}

	var currentPage;
	var mood = [
		{ name: 'Broke' },
		{ name: 'Nerdy' },
		{ name: 'Rich' },
		{ name: 'Responsible' },
		{ name: 'Loved' },
		{ name: 'Social' }
	];

	var navActive = [
		{ mStoryAct: '' },
		{ reportsAct: '' },
		{ myProfileAct: '' },
		{ accountAct: '' },
		{ messagesAct: '' }
	]

	app.get('/', isLoggedIn, function (req, res) {
		loginStatus = checkLoginStatus(req);
		currentPage = req.session.activePage = "/";
		mobile = req.useragent["isMobile"]
		if (mobile) {
			res.render('mobile.ejs', {
				user: req.user,
				smessage: req.flash('signupMessage'),
				lmessage: req.flash('loginMessage'),
				selectorDisplay: "hide",
				loggedIn: loginStatus,
				footerDisplay: "show",
				footerData1: "Blog",
				footerData2: "FAQs",
				moods: mood

			});
		}
		else {
			res.render('index.ejs', {
				user: req.user,
				smessage: req.flash('signupMessage'),
				lmessage: req.flash('loginMessage'),
				selectorDisplay: "hide",
				loggedIn: loginStatus,
				footerDisplay: "show",
				footerData1: "Blog",
				footerData2: "FAQs",
				moods: mood
			});
		}
	});

	app.get('/FAQs', isLoggedIn, function (req, res) {
		currentPage = req.session.activePage = "/FAQs";
		loginStatus = checkLoginStatus(req);
		mobile = req.useragent["isMobile"]
		if (mobile)
			pageName = "faqMobile";
		else
			pageName = "faqs";
		res.render(pageName, {
			selectorDisplay: "show",
			smessage: req.flash('signupMessage'),
			lmessage: req.flash('loginMessage'),
			loggedIn: loginStatus,
			user: req.user,
			footerDisplay: "show",
			footerData1: "Blog",
			footerData2: "FAQs"
		});
	});


	app.get('/Pricing', isLoggedIn, function (req, res) {
		currentPage = req.session.activePage = "/Pricing";
		loginStatus = checkLoginStatus(req);
		mobile = req.useragent["isMobile"]
		if (mobile)
			pageName = "howItWorksMobile";
		else
			pageName = "howItWorks";
		if (req.session.payU) {
			console.log(req.session.payU);
			payUData = JSON.parse(JSON.stringify(req.session.payU))
			req.session.payU.flashMessage = false;
		} else {
			console.log("is data undefined")
			payUData = "";
		}
		console.log("pay u data" + payUData.amount);
		if (req.session.ForPayment) {
			schemeAsked = true;
		} else {
			schemeAsked = false;
		}

		async.waterfall([
			function (callback) {

				if (loginStatus) {
					//check for user payment status

					current_date = new Date();

					var paid = false;
					var query = client.query(" select * from usersubscriptions where userid=" + req.session.user.userid + " and current_date <= planrenewaldate", function (err, result) {
						if (err)
							console.log("Cant get portfolio details in goal selection");
						if (result.rows.length > 0) {

							paid = true;
							//console.log(result.length+"payment True"+paid+req.session.user.userid);
							callback(null, paid)
						} else {
							paid = false;
							// console.log(result.length+"payment False"+paid+req.session.user.userid);
							callback(null, paid)
						}
					});


					//console.log(paid)
				} else
					callback(null, false)

			}], function (err, result) {

				res.render(pageName, {
					user: req.user,
					payU: payUData,
					selectorDisplay: "show",
					smessage: req.flash('signupMessage'),
					lmessage: req.flash('loginMessage'),
					loggedIn: loginStatus,
					paid: result,
					footerDisplay: "show",
					footerData1: "Video Tour",
					footerData2: "FAQs"
				});

			})








	});

	app.post('/Pricing/failure', isLoggedIn, function (req, res) {

		loginStatus = checkLoginStatus(req);
		currentPage = req.session.activePage = "/Pricing";
		req.session.payU = req.body;
		req.session.payU.flashMessage = true;
		req.session.payU.status = "fail"

		console.log(res.json(req.body));
	});

	app.post('/Pricing/success', isLoggedIn, function (req, res) {
		loginStatus = checkLoginStatus(req);
		currentPage = req.session.activePage = "/Pricing/success";

		// res.json(req.body);
		req.session.payU = req.body;
		req.session.payU.flashMessage = true;
		console.log("initailze the payU " + req.session.payU.amount);

		console.log("pricing Success" + req.body.amount + "userid" + req.session.user.userid);

		var orderDate = req.body.addedon;

		var days = 30;
		var renewDate = renewalDate(days, orderDate);
		var planId = 1;
		var amount = req.body.amount;
		var status = req.body.status;
		var payRef = req.body.mihpayid;
		var txnId = req.body.txnid;
		var creation_date = new Date();
		var modified_date = new Date();

		async.waterfall([
			function (callback) {

				var query = client.query("INSERT INTO usersubscriptionsorder(userid,orderdate,amount,paymentreference,status,created,modified,createdby) values($1,$2,$3,$4,$5,$6,$7,$8) RETURNING usersubscriptionorderid", [req.session.user.userid, orderDate, amount, payRef, status,
					creation_date, modified_date, req.session.user.name], function (err, result) {
						if (err) {
							console.log("cant insert usersubscriptionsorder data", err);
							//res.send("false");
						} else {
							//res.send(1);
							console.log("usersubscriptionorderid" + result.rows[0]['usersubscriptionorderid']);

							callback(null, result.rows[0]['usersubscriptionorderid'])
						}


					});


			}, function (id, callback) {


				var query = client.query("INSERT INTO usersubscriptions(userid,planid,usersubscriptionorderid,transactionid,price,durationdays,subscribeddate,planrenewaldate,created,modified,createdby) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)", [req.session.user.userid, planId, id, txnId, amount, days, orderDate, renewDate,
					creation_date, modified_date, req.session.user.name], function (err, result) {
						if (err) {
							console.log("cant insert usersubscriptions data", err);
							//res.send("false");
						} else {
							//res.send(1);


							callback(null, 'done')
						}


					});


			}],
			function (err, result) {

				if (err)
					throw err;



				res.redirect("/Pricing");

			}

		)

		//insert into the usersubscriptionsorder and get the usersubscriptionsorderid
		//insert into the usersubscriptions




	});

	app.post('/Pricing/pay', isLoggedIn, function (req, res, next) {

		currentPage = req.session.activePage = "/Pricing/pay";

		loginStatus = checkLoginStatus(req);


		async.waterfall([
			function (callback) {

				const merchantKey = 'gtKFFx';
				const salt = 'eCwWELxi';
				const txnid = getTransactionID(req.session.user.userid);
				const amount = req.body.planPrice;
				// if(amount == 100){
				//     const productinfo = 'Basic Plan';
				// }
				const productinfo = req.body.plan;

				// Get from session or User database
				const firstname = req.session.user.name;
				const email = req.session.user.email;
				const phone = req.session.user.mobile;

				const str = merchantKey + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|||||||||||' + salt;
				console.log("str ", str);

				const hash = checksum(str, 'sha512').toLowerCase();
				console.log("hash ", hash);

				data = {
					merchantKey: 'gtKFFx',
					hash: 'eCwWELxi',
					amount: amount,
					txnid: txnid,
					firstname: firstname,
					productinfo: productinfo,
					email: email,
					phone: phone,
					surl: 'http://54.152.36.19:3000/Pricing/success',
					furl: 'http://54.152.36.19:3000/Pricing/failure',
					hash: hash,
					service_provider: 'payu_paisa',
					action: 'https://test.payu.in/_payment'
				}

				console.log(data);

				callback(null, data)
			}],
			function (err, result) {

				if (err)
					throw err;
				res.render('redirect', { data: result });
			}

		)






	});

	app.get('/KnowUs', isLoggedIn, function (req, res) {

		currentPage = req.session.activePage = "/KnowUs";

		loginStatus = checkLoginStatus(req);

		mobile = req.useragent["isMobile"];
		if (mobile)
			pageName = "knowUsMobile";
		else
			pageName = "knowUs";

		res.render(pageName, {
			user: req.user,
			selectorDisplay: "show",
			smessage: req.flash('signupMessage'),
			lmessage: req.flash('loginMessage'),
			loggedIn: loginStatus,
			footerDisplay: "show",
			footerData1: "Blog",
			footerData2: "FAQs"


		});
	});

	app.post("/PANStatus", function (req, res) {
		currentPage = req.session.activePage = "/PANStatus";
		loginStatus = checkLoginStatus(req);
		if (loginStatus) {
		} else {
			console.log("end");
		}
	});

	app.get('/GoalInvest', isLoggedIn, function (req, res) {
		currentPage = req.session.activePage = "/GoalInvest";
		loginStatus = checkLoginStatus(req);
		mobile = req.useragent["isMobile"];
		if (mobile)
			pageName = "mobileMood";
		else
			// pageName = "scheme";
			pageName = "mood";
		if (req.session.bseStatus) {
			panMsg = req.session.bseStatus;

		} else {
			panMsg = "";
		}

		async.waterfall([
			function (callback) {
				//get the assets from the db 
				var assets;
				var query = client.query("select to_json(row) as asset from (select * from categoryallocationmatrix) row", function (err, result) {
					if (err)
						console.log("Cant get Aeets values");
					assets = result.rows;
					callback(null, assets)
				});
			}, function (assets, callback) {
				if (loginStatus) {
					//check for user payment status
					//
					var paid = false;
					var query = client.query(" select * from usersubscriptions where userid=" + req.session.user.userid + " and current_date <= planrenewaldate", function (err, result) {
						if (err)
							console.log("Cant get portfolio details in goal selection");
						console.log("Lenght" + result.rows.length);
						if (result.rows.length > 0) {
							paid = true;
							req.session.paid = true;
							callback(null, paid, assets)
						} else {
							paid = false;
							req.session.paid = false;
							callback(null, paid, assets)
						}
					});




				}
				else {


					//render the get started page for get request 
					console.log("else not log in");
					res.render(pageName, {
						data: assets,
						user: req.user,
						selectorDisplay: "show",
						loggedIn: loginStatus,
						firslist: false,
						smessage: req.flash('signupMessage'),
						lmessage: req.flash('loginMessage'),
						footerDisplay: "hide",
						panMessage: "",
						footerData1: "Blog",
						footerData2: "FAQs",
						scheme: false,
						paid: false,
						abcd: false,
						assetFromDb: false,
						showPage5: "hide",
						hideAll: "show"
					});
					//callback(true);	
					callback(true, 'ok')
				}

			},
			function (paid, assets, callback) {

				console.log("payment" + paid)

				if (paid) {

					async.waterfall([function (callback) {

						//Fetch Header 
						//store the data in a json
						var query = client.query("SELECT * FROM savedplansheader where userid=$1 ORDER BY created DESC LIMIT 1 ", [req.session.user.userid],
							function (err, result) {
								if (err)
									console.log("Cant get assets values");


								console.log("details header" + result.rows.length);
								asetData = result.rows[0];
								if (result.rows.length > 0) {

									req.session.savedplanheader = asetData;

									console.log("saved plan header" + req.session.savedplanheader.sip);
									console.log("saved plan header" + req.session.savedplanheader.goalid);
									console.log("saved plan header" + req.session.savedplanheader.riskprofile);
									console.log("saved plan header" + req.session.savedplanheader.masteramount);
									console.log("saved plan header" + req.session.savedplanheader.totalyears);
									console.log("saved plan header" + req.session.savedplanheader.userid);

									callback(null, asetData)

								} else {

									res.render(pageName, {
										data: assets,
										user: req.user,
										selectorDisplay: "show",
										loggedIn: loginStatus,
										firslist: false,
										smessage: req.flash('signupMessage'),
										lmessage: req.flash('loginMessage'),
										footerDisplay: "hide",
										panMessage: "",
										footerData1: "Blog",
										footerData2: "FAQs",
										scheme: false,
										paid: paid,
										abcd: false,
										assetFromDb: false,
										showPage5: "hide",
										hideAll: "show"
									});

								}




							})


					},
					function (headerData, callback) {
						//console.log(headerData)



						var query = client.query("SELECT * FROM savedplansdetail where savedplanid=$1 and allocationtype=$2", [headerData.savedplanid, 'scheme'],
							function (err, result) {
								if (err)
									console.log("Cant get assets values");


								asetDataDetail = result.rows;
								console.log(asetDataDetail);
								req.session.savedplandetail = asetDataDetail;

								console.log("test" + req.session.bseStatus);

								res.render(pageName, {
									data: assets,
									user: req.user,
									schemeData: asetDataDetail,
									smessage: req.flash('signupMessage'),
									lmessage: req.flash('loginMessage'),
									selectorDisplay: "show",
									loggedIn: loginStatus,
									footerDisplay: "hide",
									footerData1: "Blog",
									footerData2: "FAQs",
									scheme: true,
									panMessage: panMsg,
									abcd: false,
									paid: true,
									assetFromDb: headerData,
									showPage5: "show"
								});
								//callback(null,headerData,asetDataDetail)
							})
					}], function (err, result) {





					})


					//console.log("ssds"+engineData);
					//set rendering values 
					//callback(null,schemeData)
				}
				else {
					res.render(pageName, {
						data: assets,
						user: req.user,
						selectorDisplay: "show",
						loggedIn: loginStatus,
						firslist: false,
						smessage: req.flash('signupMessage'),
						lmessage: req.flash('loginMessage'),
						footerDisplay: "hide",
						panMessage: "",
						footerData1: "Blog",
						footerData2: "FAQs",
						scheme: false,
						paid: false,
						abcd: false,
						assetFromDb: false,
						showPage5: "hide",
						hideAll: "show"
					});
				}

			}], function (err, result) {

				if (err = 'ok')
					return;



			})


	})

	app.get('/user_data', isLoggedIn, function (req, res) {
		console.log(req.session);
		loginStatus = checkLoginStatus(req);
		console.log(checkLoginStatus(req));
		res.setHeader('Content-Type', 'application/json');
		res.send(req.session);
	})

	// Goal Selection
	app.get('/GoalSelection', isLoggedIn, function (req, res) {
		currentPage = req.session.activePage = "/GoalSelection";
		loginStatus = checkLoginStatus(req);
		mobile = req.useragent["isMobile"];
		if (mobile)
			pageName = "mobileMood";
		else
			pageName = "mood";
		if (req.session.bseStatus) {
			panMsg = req.session.bseStatus;
		} else {
			panMsg = "";
		}
		async.waterfall([
			function (callback) {
				//get the assets from the db 
				var assets;

				var query = client.query("select to_json(row) as asset from (select * from categoryallocationmatrix) row", function (err, result) {
					if (err)
						console.log("Cant get Aeets values");

					assets = result.rows;
					callback(null, assets)
				});

			}, function (assets, callback) {

				if (loginStatus) {
					var paid = false;
					var query = client.query(" select * from usersubscriptions where userid=" + req.session.user.userid + " and current_date <= planrenewaldate", function (err, result) {
						if (err)
							console.log("Cant get portfolio details in goal selection");

						console.log("Lenght" + result.rows.length);
						if (result.rows.length > 0) {
							paid = true;
							req.session.paid = true;
							callback(null, paid, assets)
						} else {
							paid = false;
							req.session.paid = false;
							callback(null, paid, assets)
						}
					});
				} else {
					//render the get started page for get request 
					console.log("else not log in");
					res.render(pageName, {
						data: assets,
						user: req.user,
						selectorDisplay: "show",
						loggedIn: loginStatus,
						firslist: false,
						smessage: req.flash('signupMessage'),
						lmessage: req.flash('loginMessage'),
						footerDisplay: "hide",
						panMessage: "",
						footerData1: "Blog",
						footerData2: "FAQs",
						scheme: false,
						paid: false,
						abcd: false,
						assetFromDb: false,
						showPage5: "hide",
						hideAll: "show"
					});
					//callback(true);	
					callback(true, 'ok')
				}

			},
			function (paid, assets, callback) {
				console.log("payment" + paid)
				if (paid) {
					async.waterfall([function (callback) {
						//Fetch Header 
						//store the data in a json
						var query = client.query("SELECT * FROM savedplansheader where userid=$1 ORDER BY created DESC LIMIT 1 ", [req.session.user.userid], function (err, result) {
							if (err)
								console.log("Cant get assets values");
							console.log("details header" + result.rows.length);
							asetData = result.rows[0];
							if (result.rows.length > 0) {
								req.session.savedplanheader = asetData;
								console.log("saved plan header" + req.session.savedplanheader.sip);
								console.log("saved plan header" + req.session.savedplanheader.goalid);
								console.log("saved plan header" + req.session.savedplanheader.riskprofile);
								console.log("saved plan header" + req.session.savedplanheader.masteramount);
								console.log("saved plan header" + req.session.savedplanheader.totalyears);
								console.log("saved plan header" + req.session.savedplanheader.userid);

								callback(null, asetData)
							} else {

								res.render(pageName, {
									data: assets,
									user: req.user,
									selectorDisplay: "show",
									loggedIn: loginStatus,
									firslist: false,
									smessage: req.flash('signupMessage'),
									lmessage: req.flash('loginMessage'),
									footerDisplay: "hide",
									panMessage: "",
									footerData1: "Blog",
									footerData2: "FAQs",
									scheme: false,
									paid: paid,
									abcd: false,
									assetFromDb: false,
									showPage5: "hide",
									hideAll: "show"
								});
							}
						})
					}, function (headerData, callback) {
						//console.log(headerData)
						var query = client.query("SELECT * FROM savedplansdetail where savedplanid=$1 and allocationtype=$2", [headerData.savedplanid, 'scheme'],
							function (err, result) {
								if (err)
									console.log("Cant get assets values");
								console.log("scheme pa in goal = " + req.session.showscheme);
								if (req.session.showscheme) {
									scheme = true;
								} else {
									scheme = false;
								}
								req.session.showscheme = false;
								asetDataDetail = result.rows;
								req.session.savedplandetail = asetDataDetail;
								console.log("scheme pa in goal = " + req.session.showscheme);
								console.log("test" + req.session.bseStatus + "scheme" + scheme);
								res.render(pageName, {
									data: assets,
									user: req.user,
									schemeData: asetDataDetail,
									smessage: req.flash('signupMessage'),
									lmessage: req.flash('loginMessage'),
									selectorDisplay: "show",
									loggedIn: loginStatus,
									footerDisplay: "hide",
									footerData1: "Blog",
									footerData2: "FAQs",
									scheme: scheme,
									panMessage: panMsg,
									abcd: false,
									paid: true,
									assetFromDb: headerData,
									showPage5: "show"
								});
								//callback(null,headerData,asetDataDetail)
							})
					}], function (err, result) {
					})
				} else {
					if (req.session.showAssetAfterLogin) {

						showAsset = true;
						console.log("Offline check for bool status" + showAsset)
						//req.session.showAssetAfterLogin =false;
					}
					else {

						showAsset = false;
						console.log("Offline check for bool status" + showAsset)
					}


					res.render(pageName, {
						data: assets,
						user: req.user,
						selectorDisplay: "show",
						loggedIn: loginStatus,
						firslist: false,
						smessage: req.flash('signupMessage'),
						lmessage: req.flash('loginMessage'),
						footerDisplay: "hide",
						panMessage: "",
						footerData1: "Blog",
						footerData2: "FAQs",
						scheme: showAsset,
						paid: false,
						abcd: false,
						assetFromDb: false,
						showPage5: "hide",
						hideAll: "show"
					});
				}

			}], function (err, result) {

				if (err = 'ok')
					return;



			})


	})

	// Saved Plans
	app.get('/SavedPlans', isLoggedIn, function (req, res) {
		async.waterfall([
			function (callback) {
				var paid = false;
				var query = client.query(" select * from usersubscriptions where userid=" + req.session.user.userid + " and current_date <= planrenewaldate", function (err, result) {
					if (err)
						console.log("Cant get portfolio details in goal selection");
					console.log("Lenght" + result.rows.length);
					if (result.rows.length > 0) {
						paid = true;
						//req.session.paid = true;
						callback(null, paid)
					} else {
						paid = false;
						//req.session.paid = false;
						callback(null, paid)
					}
				});
			}, function (pay, callback) {
				//Fetch Header 
				//store the data in a json
				async.waterfall([
					function (callback) {
						//select * from users inner join profile on users.userid = profile.userid where users.userid=$1
						var query = client.query("SELECT * FROM savedplansheader inner join goal on savedplansheader.goalid = goal.goalid where savedplansheader.userid=$1 and savedplansheader.status = 'active' ORDER BY savedplansheader.created DESC  ", [req.session.user.userid],
							function (err, result) {
								if (err)
									console.log("Cant get assets values" + err);
								console.log("details header" + result.rows.length);
								asetData = result.rows;
								console.log(asetData);
								if (result.rows.length > 0) {
									//req.session.savedplanheader = asetData;
									callback(null, asetData)
								} else {
									res.render('savedPlans', {
										user: req.user,
										selectorDisplay: "show",
										assetPlanDetail: false,
										plansHeader: false,
										plansDetail: false,
										loggedIn: loginStatus,
										smessage: req.flash('signupMessage'),
										lmessage: req.flash('loginMessage'),
										footerDisplay: "hide",
										footerData1: "Blog",
										footerData2: "FAQs",
									});
								}
							})
					}, function (headerData, callback) {
						var x = 1;
						var y = headerData.length;
						for (i = 0; i < headerData.length; i++) {
							var asetDataAllocationDetail = [];
							if (x <= y) {
								var query = client.query("SELECT * FROM savedplansdetail where savedplanid=$1 and allocationtype=$2", [headerData[i].savedplanid, 'allocation'],
									function (err, result) {
										if (err)
											console.log("Cant get assets values");
										asetDataAllocationDetail = result.rows;
										//req.session.savedplandetail = asetDataDetail;
										console.log(asetDataAllocationDetail);
										if (x >= y) {
											if (pay) {
												callback(null, asetData, asetDataAllocationDetail)
											} else {
												//only render the data present in the header
												res.render('savedPlans', {
													user: req.user,
													plansHeader: asetData,
													assetPlanDetail: asetDataAllocationDetail,
													plansDetail: false,
													selectorDisplay: "show",
													loggedIn: loginStatus,
													smessage: req.flash('signupMessage'),
													lmessage: req.flash('loginMessage'),
													footerDisplay: "hide",
													footerData1: "Blog",
													footerData2: "FAQs"
												});
											}
										}
										x++;
									})
							}

						}
					}, function (headerData, asetDataAllocationDetail, callback) {
						var x = 1;
						var y = headerData.length;
						var asetDataDetail = {};
						console.log("header length" + headerData.length);
						for (i = 0; i < headerData.length; i++) {
							if (x <= y) {
								var query = client.query("SELECT * FROM savedplansdetail where savedplanid=$1 and allocationtype=$2", [headerData[i].savedplanid, 'scheme'],
									function (err, result) {
										if (err)
											console.log("Cant get assets values");
										asetDataDetail = result.rows;
										//	asetDataDetail[i] = dataDetail;
										//req.session.savedplandetail = asetDataDetail;
										console.log("saved detail" + asetDataDetail);
										if (x >= y) {
											res.render('savedPlans', {
												user: req.user,
												assetPlanDetail: asetDataAllocationDetail,
												plansHeader: headerData,
												plansDetail: asetDataDetail,
												selectorDisplay: "show",
												loggedIn: loginStatus,
												smessage: req.flash('signupMessage'),
												lmessage: req.flash('loginMessage'),
												footerDisplay: "hide",
												footerData1: "Blog",
												footerData2: "FAQs"
											});
										}
										x++;
									})
							}
						}
					}], function (err, result) {
					})
			}
		], function (err, result) {
			//console.log(result);
		})
	});

	app.get('/BsePaymentStatus', isLoggedIn, function (req, res) {


		var userID = "109401";
		var memberID = "10940";
		var password = "123456";
		var passKey = "test";


		async.waterfall([
			function (callback) {

				//get Password for Payment Link
				var options = {
					method: 'POST',
					url: 'http://bsestarmfdemo.bseindia.com/MFUploadService/MFUploadService.svc/Basic',
					headers: {
						'cache-control': 'no-cache',
						'content-type': 'application/soap+xml; charset=utf-8'
					},
					body: '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="http://bsestarmfdemo.bseindia.com/2016/01/" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">\n   <soap:Header>\n   <a:Action >http://bsestarmfdemo.bseindia.com/2016/01/IMFUploadService/getPassword</a:Action>\n   <a:To>http://bsestarmfdemo.bseindia.com/MFUploadService/MFUploadService.svc/Basic</a:To>\n   </soap:Header>\n   <soap:Body>\n      <ns:getPassword  xmlns="http://bsestarmfdemo.bseindia.com/2016/01/IMFUploadService/getPassword">\n         <ns:UserId>109401</ns:UserId>\n         <ns:MemberId>10940</ns:MemberId>\n         <ns:Password>123456</ns:Password>\n         <ns:PassKey>test</ns:PassKey>\n      </ns:getPassword>\n   </soap:Body>\n</soap:Envelope>'
				};

				request(options, function (error, response, body) {
					if (error) throw new Error(error);

					parseString(body, function (err, results) {
						// Get The Result From The Soap API and Parse it to JSON

						//	console.log(buffer);
						//
						var password = results["s:Envelope"]["s:Body"][0]["getPasswordResponse"][0]["getPasswordResult"][0];
						//console.log("myFault"+results["Fault"]["Reason"][0]["Text"]);
						bsePassArray = password.toString().split("|");
						console.log("MFUPload Service Password " + bsePassArray[1]);
						callback(null, bsePassArray[1])

					})

				});


			}, function (pass, callback) {


				//Check the Payment Status
				var options = {
					method: 'POST',
					url: 'http://bsestarmfdemo.bseindia.com/MFUploadService/MFUploadService.svc/Basic',
					headers: {
						'cache-control': 'no-cache',
						'content-type': 'application/soap+xml; charset=utf-8'
					},
					body: '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="http://bsestarmfdemo.bseindia.com/2016/01/" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">\n   <soap:Header>\n   <a:Action >http://bsestarmfdemo.bseindia.com/2016/01/IMFUploadService/MFAPI</a:Action>\n   <a:To>http://bsestarmfdemo.bseindia.com/MFUploadService/MFUploadService.svc/Basic</a:To>\n   </soap:Header>\n   <soap:Body>\n      <ns:MFAPI  xmlns="http://bsestarmfdemo.bseindia.com/2016/01/IMFUploadService/MFAPI">\n         <ns:Flag>11</ns:Flag>\n		 <ns:UserId>109401</ns:UserId>\n         <ns:EncryptedPassword>' + pass + '</ns:EncryptedPassword>\n         <ns:param>SOHANDEMO2|723854|BSEMF</ns:param>\n            </ns:MFAPI>\n   </soap:Body>\n</soap:Envelope>'
				};

				request(options, function (error, response, body) {
					if (error) throw new Error(error);

					parseString(body, function (err, results) {
						// Get The Result From The Soap API and Parse it to JSON

						//console.log(results);
						//
						var link = results["s:Envelope"]["s:Body"][0]["MFAPIResponse"][0]["MFAPIResult"][0];
						//console.log("myFault"+results["Fault"]["Reason"][0]["Text"]);
						bsePaymentStatus = link.toString().split("|");
						console.log("Payment Status " + bsePaymentStatus[1]);
						req.session.bseStatus = bsePaymentStatus;
						//return bsePaymentStatus[1];
						// callback(null,bseLinkArray[1])
						res.redirect("/myStory");

					})

				});

			}], function (err, result) {


			})




	});


	app.post('/InsertOrders', isLoggedIn, function (req, res) {

		var userID = "109401";
		var memberID = "10940";
		var password = "123456";
		var passKey = "test";

		async.waterfall([
			function (callback) {

				//user investments header
				var userId = req.session.savedplanheader.userid;
				var goalId = req.session.savedplanheader.goalid;
				var riskProfile = req.session.savedplanheader.riskprofile;
				var masterAmount = req.session.savedplanheader.masteramount;
				var totalYears = req.session.savedplanheader.totalyears;
				var sip = req.session.savedplanheader.sip;
				var status = "pending";


				creation_date = new Date();
				modified_date = new Date();

				//Header table insert
				var query = client.query("INSERT INTO userinvestmentsheader(userid,goalid,riskprofile, masteramount, totalyears, sip,status,created,modified,createdby) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING userinvestmentheaderid", [userId, goalId, riskProfile, masterAmount, totalYears, sip, status,
					creation_date, modified_date, req.session.user.name], function (err, result) {
						if (err) {
							console.log("cant insert assets header allocation data", err);
							res.send("false");
						} else {
							//res.send(1);
							console.log("savedplanid" + result.rows[0]['userinvestmentheaderid']);

							req.session.userinvestmentheaderid = result.rows[0]['userinvestmentheaderid'];
							callback(null, req.session.userinvestmentheaderid)
						}
					});
			}, function (userid, callback) {

				var len = req.session.savedplandetail.length;
				//user investment orders
				var userId = req.session.savedplanheader.userid;
				var goalId = req.session.savedplanheader.goalid;
				var riskProfile = req.session.savedplanheader.riskprofile;

				var userinvestmentheaderid = req.session.userinvestmentheaderid;

				var orderDate = new Date();
				var userPan = "AKBPB7607H";
				var orderType = "invest";


				var bsetxn = [];
				var userinvestmentorderid = [];
				//user investments detail


				var x = 1;
				var y = len;

				for (i = 0; i < len; i++) {
					var transNo = getTransactionID(req.session.user.userid) + i;
					console.log("out loop" + req.session.savedplandetail[i].allocationdescription);
					var amount = req.session.savedplandetail[i].allocationamount;
					var schemeCode = req.session.savedplandetail[i].schemecode;
					var schemeDesc = req.session.savedplandetail[i].allocationdescription;
					var schemeCategory = req.session.savedplandetail[i].allocationcategory;
					var allocationPercentage = req.session.savedplandetail[i].allocationpercentage;

					var schemeId = req.session.savedplandetail[i].schemeid;


					if (x <= y) {
						bsetxn[i] = transNo;
						console.log("SchemeDesc" + schemeDesc + "id" + schemeId + "amount" + amount + "txn" + bsetxn[i]);
						var query = client.query("INSERT INTO userinvestmentorders(userinvestmentorderdate,userid,userpan,ordertype,goalid,riskprofile,schemeid,amount,bsetxnreference,created,modified,createdby) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING userinvestmentorderid", [orderDate, userId, userPan, orderType, goalId, riskProfile, schemeId, amount, transNo,
							creation_date, modified_date, req.session.user.name], function (err, result1) {
								if (err) {
									console.log("cant insert assets header allocation data", err);
									res.send("false");
								} else {
									//res.send(1);
									console.log("userinvestmentorderid" + result1.rows[0]['userinvestmentorderid']);

									var dummy = result1.rows[0]['userinvestmentorderid'];
									userinvestmentorderid.push(dummy);
									console.log("dummy" + userinvestmentorderid + "i" + i);

									//userinvestmentorderid[i] =dummy;


									if (x >= y) {
										console.log("inside callback" + i)
										//							console.log("inside callback x"+x)
										//							console.log("inside callback y"+y)
										console.log("send" + userinvestmentorderid + "transaction" + bsetxn)
										req.session.bsetxn = bsetxn;
										callback(null, userinvestmentorderid)
									}
									x++;

									console.log("inside loop x" + x)
									console.log("inside loop y" + y)

								}


							});


					}


				}

			}, function (id, callback) {

				var len = req.session.savedplandetail.length;
				//user investment orders
				var userId = req.session.savedplanheader.userid;
				var goalId = req.session.savedplanheader.goalid;
				var riskProfile = req.session.savedplanheader.riskprofile;

				var userinvestmentheaderid = req.session.userinvestmentheaderid;


				var orderDate = new Date();
				var userPan = "AKBPB7607H";
				var orderType = "invest";



				//user investments detail


				var x = 1;
				var y = len;

				for (i = 0; i < len; i++) {
					var userinvestmentorderid = id[i];
					var transNo = getTransactionID(req.session.user.userid) + i;
					console.log("out loop" + req.session.savedplandetail[i].allocationdescription);
					var amount = req.session.savedplandetail[i].allocationamount;
					var schemeCode = req.session.savedplandetail[i].schemecode;
					var schemeDesc = req.session.savedplandetail[i].allocationdescription;
					var schemeCategory = req.session.savedplandetail[i].allocationcategory;
					var allocationPercentage = req.session.savedplandetail[i].allocationpercentage;

					var schemeId = req.session.savedplandetail[i].schemeid;
					console.log("orderid" + userinvestmentorderid);

					if (x <= y) {
						var query = client.query("INSERT INTO userinvestmentdetail(userinvestmentheaderid,schemeid,schemedescription,schemecategory,allocationpercentage,allocationamount,created,modified,createdby,orderid,schemecode) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)", [userinvestmentheaderid, schemeId, schemeDesc, schemeCategory, allocationPercentage, amount, creation_date, modified_date, req.session.user.name, userinvestmentorderid, schemeCode],
							function (err, result2) {
								if (err) {
									console.log("cant insert assets header allocation data", err);
									res.send("false");
								} else {
									//res.send(1);
									console.log("User investment details" + result2.rows);


									if (x >= y) {
										//							console.log("inside callback"+i)
										//							console.log("inside callback x"+x)
										//							console.log("inside callback y"+y)
										callback(null, x)
									}
									x++;

									console.log("inside loop x" + x)
									console.log("inside loop y" + y)





								}


							});


					}


				}
			},
			function (x, callback) {


				//get the password for the order creation 

				var options = {
					method: 'POST',
					url: 'http://bsestarmfdemo.bseindia.com/MFOrderEntry/MFOrder.svc',
					headers: {
						'cache-control': 'no-cache',
						'content-type': 'application/soap+xml; charset=utf-8'
					},
					body: '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="http://bsestarmf.in/" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">\n   <soap:Header>\n   <a:Action >http://bsestarmf.in/MFOrderEntry/getPassword</a:Action>\n   <a:To>http://bsestarmfdemo.bseindia.com/MFOrderEntry/MFOrder.svc</a:To>\n   </soap:Header>\n   <soap:Body>\n      <ns:getPassword  xmlns="http://bsestarmf.in/MFOrderEntry/getPassword">\n         <ns:UserId>109401</ns:UserId>\n          <ns:Password>123456</ns:Password>\n         <ns:PassKey>test</ns:PassKey>\n      </ns:getPassword>\n   </soap:Body>\n</soap:Envelope>'
				};

				request(options, function (error, response, body) {
					if (error) throw new Error(error);

					parseString(body, function (err, results) {
						// Get The Result From The Soap API and Parse it to JSON

						//	console.log(buffer);
						//
						var password = results["s:Envelope"]["s:Body"][0]["getPasswordResponse"][0]["getPasswordResult"][0];
						//console.log("myFault"+results["Fault"]["Reason"][0]["Text"]);
						orderBsePassArray = password.toString().split("|");
						console.log("Order ENtry Service Password " + orderBsePassArray[1]);
						callback(null, orderBsePassArray[1])

					})

				});





			},
			function (pass, callback) {

				var len = req.session.savedplandetail.length;

				x = 1; y = len;

				//order entry
				for (i = 0; i < len; i++) {


					console.log("init x" + x);
					console.log("init" + y);


					var amount = req.session.savedplandetail[i].allocationamount;

					console.log("bse" + i);
					var transCode = "NEW";
					var transNo = req.session.bsetxn[i];
					var orderId = "";
					var clientCode = "SOHANDEMO2";
					var schemeCode = req.session.savedplandetail[i].schemecode;
					var buySell = "P";
					var buySellType = "FRESH";
					var DPTxn = "P";
					var orderValue = amount;
					var quantity = "";
					var allRedeem = "N";
					var folioNo = "";
					var remarks = "";
					var KYCStatus = "Y";
					var refNo = "";
					var subBrCode = "";
					var EUIN = "E123456";
					var EUINVal = "Y";
					var minRedeem = "N";
					var DPC = "N";
					var IPAdd = "";

					console.log("transactionNo" + transNo[i]);
					var orderBody = '<ns:TransCode>' + transCode + '</ns:TransCode><ns:TransNo>' + transNo + '</ns:TransNo><ns:OrderId>' + orderId + '</ns:OrderId><ns:UserID>' + userID + '</ns:UserID><ns:MemberId>' + memberID + '</ns:MemberId><ns:ClientCode>' + clientCode + '</ns:ClientCode><ns:SchemeCd>' + schemeCode + '</ns:SchemeCd><ns:BuySell>' + buySell + '</ns:BuySell><ns:BuySellType>' + buySellType + '</ns:BuySellType><ns:DPTxn>' + DPTxn + '</ns:DPTxn><ns:OrderVal>' + orderValue + '</ns:OrderVal><ns:Qty>' + quantity + '</ns:Qty><ns:AllRedeem>' + allRedeem + '</ns:AllRedeem><ns:FolioNo>' + folioNo + '</ns:FolioNo><ns:Remarks>' + remarks + '</ns:Remarks><ns:KYCStatus>' + KYCStatus + '</ns:KYCStatus><ns:RefNo>' + refNo + '</ns:RefNo><ns:SubBrCode>' + subBrCode + '</ns:SubBrCode><ns:EUIN>' + EUIN + '</ns:EUIN><ns:EUINVal>' + EUINVal + '</ns:EUINVal><ns:MinRedeem>' + minRedeem + '</ns:MinRedeem><ns:DPC>' + DPC + '</ns:DPC><ns:IPAdd>' + IPAdd + '</ns:IPAdd><ns:Password>' +
						pass + '</ns:Password><ns:PassKey>' + passKey + '</ns:PassKey><ns:Parma1></ns:Parma1><ns:Param2></ns:Param2><ns:Param3></ns:Param3>';

					var options = {
						method: 'POST',
						url: 'http://bsestarmfdemo.bseindia.com/MFOrderEntry/MFOrder.svc',
						headers: {
							'cache-control': 'no-cache',
							'content-type': 'application/soap+xml; charset=utf-8'
						},
						body: '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="http://bsestarmf.in/" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">\n   <soap:Header>\n   <a:Action >http://bsestarmf.in/MFOrderEntry/orderEntryParam</a:Action>\n   <a:To>http://bsestarmfdemo.bseindia.com/MFOrderEntry/MFOrder.svc</a:To>\n   </soap:Header>\n   <soap:Body>\n      <ns:orderEntryParam  xmlns="http://bsestarmf.in/MFOrderEntry/orderEntryParam">\n         ' + orderBody + '  </ns:orderEntryParam>\n   </soap:Body>\n</soap:Envelope>'
					};

					console.log("in loop" + req.session.savedplandetail[i].allocationdescription);

					request(options, function (error, response, body) {
						if (error) throw new Error(error);


						parseString(body, function (err, results) {
							// Get The Result From The Soap API and Parse it to JSON

							//	console.log(buffer);
							//
							var orderResponse = results["s:Envelope"]["s:Body"][0]["orderEntryParamResponse"][0]["orderEntryParamResult"];
							bseOrderArray = orderResponse.toString().split("|");
							console.log("Transaction code - " + bseOrderArray[0]);
							console.log("Unique Reference Number - " + bseOrderArray[1]);
							console.log("Order Number - " + bseOrderArray[2]);
							console.log("UserId - " + bseOrderArray[3]);
							console.log("MemberId - " + bseOrderArray[4]);
							console.log("Client Code - " + bseOrderArray[5]);
							console.log("BSE Remarks - " + bseOrderArray[6]);
							console.log("Flag - " + bseOrderArray[7]);
							var bseStatus;
							if (bseOrderArray[7] == 1)
								bseStatus = "failure";
							else
								bseStatus = "success";

							var bseTransactionReference = bseOrderArray[1];
							var bseOrderReference = bseOrderArray[2];


							if (x <= y) {

								var query = client.query("UPDATE userinvestmentorders SET bseorderreference = $1, bsestatus = $2 WHERE bsetxnreference =$3 ", [bseOrderReference, bseStatus, bseTransactionReference], function (err, result1) {
									if (err) {
										console.log("cant insert assets header allocation data", err);
										res.send("false");
									} else {
										//res.send(1);
										// console.log("userinvestmentorderid"+result1.rows[0]['userinvestmentorderid']);


										//userinvestmentorderid = result1.rows[0]['userinvestmentheaderid'];



										if (x >= y) {
											//							console.log("inside callback"+i)
											//							console.log("inside callback x"+x)
											//							console.log("inside callback y"+y)
											callback(null)
										}
										x++;

										console.log("inside loop x" + x)
										console.log("inside loop y" + y)

									}


								});



							} else {

								console.log("count is more than the expected value" + x + "length" + y);
							}





						})

					});


				}

			},
			function (callback) {

				console.log("I am the payment ");
				//get Password for Payment Link
				var options = {
					method: 'POST',
					url: 'http://bsestarmfdemo.bseindia.com/MFUploadService/MFUploadService.svc/Basic',
					headers: {
						'cache-control': 'no-cache',
						'content-type': 'application/soap+xml; charset=utf-8'
					},
					body: '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="http://bsestarmfdemo.bseindia.com/2016/01/" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">\n   <soap:Header>\n   <a:Action >http://bsestarmfdemo.bseindia.com/2016/01/IMFUploadService/getPassword</a:Action>\n   <a:To>http://bsestarmfdemo.bseindia.com/MFUploadService/MFUploadService.svc/Basic</a:To>\n   </soap:Header>\n   <soap:Body>\n      <ns:getPassword  xmlns="http://bsestarmfdemo.bseindia.com/2016/01/IMFUploadService/getPassword">\n         <ns:UserId>109401</ns:UserId>\n         <ns:MemberId>10940</ns:MemberId>\n         <ns:Password>123456</ns:Password>\n         <ns:PassKey>test</ns:PassKey>\n      </ns:getPassword>\n   </soap:Body>\n</soap:Envelope>'
				};

				request(options, function (error, response, body) {
					if (error) throw new Error(error);

					parseString(body, function (err, results) {
						// Get The Result From The Soap API and Parse it to JSON

						//	console.log(buffer);
						//
						var password = results["s:Envelope"]["s:Body"][0]["getPasswordResponse"][0]["getPasswordResult"][0];
						//console.log("myFault"+results["Fault"]["Reason"][0]["Text"]);
						bsePassArray = password.toString().split("|");
						console.log("MFUPload Service Password " + bsePassArray[1]);
						callback(null, bsePassArray[1])

					})

				});


			},
			function (uploadPass, callback) {



				//make the payment 


				var options = {
					method: 'POST',
					url: 'http://bsestarmfdemo.bseindia.com/MFUploadService/MFUploadService.svc/Basic',
					headers: {
						'cache-control': 'no-cache',
						'content-type': 'application/soap+xml; charset=utf-8'
					},
					body: '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="http://bsestarmfdemo.bseindia.com/2016/01/" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">\n   <soap:Header>\n   <a:Action >http://bsestarmfdemo.bseindia.com/2016/01/IMFUploadService/MFAPI</a:Action>\n   <a:To>http://bsestarmfdemo.bseindia.com/MFUploadService/MFUploadService.svc/Basic</a:To>\n   </soap:Header>\n   <soap:Body>\n      <ns:MFAPI  xmlns="http://bsestarmfdemo.bseindia.com/2016/01/IMFUploadService/MFAPI">\n         <ns:Flag>03</ns:Flag>\n		 <ns:UserId>109401</ns:UserId>\n         <ns:EncryptedPassword>' + uploadPass + '</ns:EncryptedPassword>\n         <ns:param>10940|SOHANDEMO2|http://localhost:3000/BsePaymentStatus</ns:param>\n            </ns:MFAPI>\n   </soap:Body>\n</soap:Envelope>'
				};

				request(options, function (error, response, body) {
					if (error) throw new Error(error);

					parseString(body, function (err, results) {
						// Get The Result From The Soap API and Parse it to JSON

						//console.log(results);
						//
						var link = results["s:Envelope"]["s:Body"][0]["MFAPIResponse"][0]["MFAPIResult"][0];
						//console.log("myFault"+results["Fault"]["Reason"][0]["Text"]);
						bseLinkArray = link.toString().split("|");
						console.log("Payment link " + bseLinkArray[1]);
						// callback(null,bseLinkArray[1])
						res.render('bseRedirect', { data: bseLinkArray[1] });

					})

				});

				//Check the Payment Status
				/*		 	 var options = {
									method: 'POST',
									url: 'http://bsestarmfdemo.bseindia.com/MFUploadService/MFUploadService.svc/Basic',
					headers: {
									'cache-control': 'no-cache',
									'content-type': 'application/soap+xml; charset=utf-8'
						},
					body: '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="http://bsestarmfdemo.bseindia.com/2016/01/" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">\n   <soap:Header>\n   <a:Action >http://bsestarmfdemo.bseindia.com/2016/01/IMFUploadService/MFAPI</a:Action>\n   <a:To>http://bsestarmfdemo.bseindia.com/MFUploadService/MFUploadService.svc/Basic</a:To>\n   </soap:Header>\n   <soap:Body>\n      <ns:MFAPI  xmlns="http://bsestarmfdemo.bseindia.com/2016/01/IMFUploadService/MFAPI">\n         <ns:Flag>11</ns:Flag>\n		 <ns:UserId>109401</ns:UserId>\n         <ns:EncryptedPassword>'+uploadPass+'</ns:EncryptedPassword>\n         <ns:param>SOHANTEST1|720191|BSEMF</ns:param>\n            </ns:MFAPI>\n   </soap:Body>\n</soap:Envelope>' };
				
				  request(options, function (error, response, body) {
					if (error) throw new Error(error);
				
						parseString(body, function(err, results){
					// Get The Result From The Soap API and Parse it to JSON
							
							  //console.log(results);
							//
						   var link = results["s:Envelope"]["s:Body"][0]["MFAPIResponse"][0]["MFAPIResult"][0];
						   //console.log("myFault"+results["Fault"]["Reason"][0]["Text"]);
							bsePaymentStatus = link.toString().split("|");
						   console.log("Payment Status "+bsePaymentStatus[1]);
							//return bsePaymentStatus[1];
						 // callback(null,bseLinkArray[1])
						   
				   })
					  
				  });	
						 */
			}],
			function (err, result) {

				if (err)
					throw err;




			})



	});

	app.post('/Proceed', isLoggedIn, function (req, res) {

		//bse credentials	
		var userID = "109401";
		var memberID = "10940";
		var password = "123456";
		var passKey = "test";


		async.waterfall([
			function (callback) {
				console.log(req.body.savedplanid);
				var query = client.query("SELECT * FROM savedplansheader  where savedplansheader.userid=$1 and savedplansheader.savedplanid = $2 ", [req.session.user.userid, req.body.savedplanid],
					function (err, result) {
						if (err)
							console.log("Cant get assets values" + err);


						console.log("details header" + result.rows.length);
						asetData = result.rows[0];
						console.log(asetData);
						if (result.rows.length > 0) {

							req.session.savedplanheader1 = asetData;
							console.log(req.session.savedplanheader1);
							callback(null, asetData)

						}



					})


			},
			function (asetData, callback) {


				//user investments header
				var userId = req.session.savedplanheader1.userid;
				var goalId = req.session.savedplanheader1.goalid;
				var riskProfile = req.session.savedplanheader1.riskprofile;
				var masterAmount = req.session.savedplanheader1.masteramount;
				var totalYears = req.session.savedplanheader1.totalyears;
				var sip = req.session.savedplanheader1.sip;
				var status = "pending";

				console.log(userId, goalId);

				creation_date = new Date();
				modified_date = new Date();

				//Header table insert
				var query = client.query("INSERT INTO userinvestmentsheader(userid,goalid,riskprofile, masteramount, totalyears, sip,status,created,modified,createdby) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING userinvestmentheaderid", [userId, goalId, riskProfile, masterAmount, totalYears, sip, status,
					creation_date, modified_date, req.session.user.name], function (err, result) {
						if (err) {
							console.log("cant insert assets header allocation data", err);
							res.send("false");
						} else {
							//res.send(1);
							console.log("savedplanid" + result.rows[0]['userinvestmentheaderid']);


							req.session.userinvestmentheaderid1 = result.rows[0]['userinvestmentheaderid'];
							callback(null, req.session.userinvestmentheaderid1)



						}


					});




			}, function (assetData, callback) {

				var query = client.query("SELECT * FROM savedplansdetail where savedplanid=$1 and allocationtype=$2", [req.body.savedplanid, 'scheme'],
					function (err, result) {
						if (err)
							console.log("Cant get assets values");



						asetDataAllocationDetail = result.rows;

						console.log(asetDataAllocationDetail);
						req.session.savedplandetail1 = asetDataAllocationDetail;
						callback(null, asetDataAllocationDetail)




					})




			}, function (asetDataAllocationDetail, callback) {

				var len = req.session.savedplandetail1.length;
				//user investment orders
				var userId = req.session.savedplanheader1.userid;
				var goalId = req.session.savedplanheader1.goalid;
				var riskProfile = req.session.savedplanheader1.riskprofile;

				var userinvestmentheaderid = req.session.userinvestmentheaderid1;

				var orderDate = new Date();
				var userPan = "AKBPB7607H";
				var orderType = "invest";


				var bsetxn1 = [];
				var userinvestmentorderid = [];
				//user investments detail


				var x = 1;
				var y = len;

				for (i = 0; i < len; i++) {
					var transNo = getTransactionID(req.session.user.userid) + i;
					console.log("out loop" + req.session.savedplandetail1[i].allocationdescription);
					var amount = req.session.savedplandetail1[i].allocationamount;
					var schemeCode = req.session.savedplandetail1[i].schemecode;
					var schemeDesc = req.session.savedplandetail1[i].allocationdescription;
					var schemeCategory = req.session.savedplandetail1[i].allocationcategory;
					var allocationPercentage = req.session.savedplandetail1[i].allocationpercentage;

					var schemeId = req.session.savedplandetail1[i].schemeid;


					if (x <= y) {
						bsetxn1[i] = transNo;
						console.log("SchemeDesc" + schemeDesc + "id" + schemeId + "amount" + amount + "txn" + bsetxn1[i]);
						var query = client.query("INSERT INTO userinvestmentorders(userinvestmentorderdate,userid,userpan,ordertype,goalid,riskprofile,schemeid,amount,bsetxnreference,created,modified,createdby) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING userinvestmentorderid", [orderDate, userId, userPan, orderType, goalId, riskProfile, schemeId, amount, transNo,
							creation_date, modified_date, req.session.user.name], function (err, result1) {
								if (err) {
									console.log("cant insert assets header allocation data", err);
									res.send("false");
								} else {
									//res.send(1);
									console.log("userinvestmentorderid" + result1.rows[0]['userinvestmentorderid']);

									var dummy = result1.rows[0]['userinvestmentorderid'];
									userinvestmentorderid.push(dummy);
									console.log("dummy" + userinvestmentorderid + "i" + i);

									//userinvestmentorderid[i] =dummy;


									if (x >= y) {
										console.log("inside callback" + i)
										//							console.log("inside callback x"+x)
										//							console.log("inside callback y"+y)
										console.log("send" + userinvestmentorderid + "transaction" + bsetxn1)
										req.session.bsetxn1 = bsetxn1;
										callback(null, userinvestmentorderid)
									}
									x++;

									console.log("inside loop x" + x)
									console.log("inside loop y" + y)

								}


							});


					}


				}

			}, function (id, callback) {

				var len = req.session.savedplandetail1.length;
				//user investment orders

				var userId = req.session.savedplanheader1.userid;
				var goalId = req.session.savedplanheader1.goalid;
				var riskProfile = req.session.savedplanheader1.riskprofile;

				var userinvestmentheaderid = req.session.userinvestmentheaderid1;


				var orderDate = new Date();
				var userPan = "AKBPB7607H";
				var orderType = "invest";



				//user investments detail


				var x = 1;
				var y = len;

				for (i = 0; i < len; i++) {
					var userinvestmentorderid = id[i];
					var transNo = getTransactionID(req.session.user.userid) + i;
					console.log("out loop" + req.session.savedplandetail1[i].allocationdescription);
					var amount = req.session.savedplandetail1[i].allocationamount;
					var schemeCode = req.session.savedplandetail1[i].schemecode;
					var schemeDesc = req.session.savedplandetail1[i].allocationdescription;
					var schemeCategory = req.session.savedplandetail1[i].allocationcategory;
					var allocationPercentage = req.session.savedplandetail1[i].allocationpercentage;

					var schemeId = req.session.savedplandetail1[i].schemeid;
					console.log("orderid" + userinvestmentorderid);

					if (x <= y) {
						var query = client.query("INSERT INTO userinvestmentdetail(userinvestmentheaderid,schemeid,schemedescription,schemecategory,allocationpercentage,allocationamount,created,modified,createdby,orderid,schemecode) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)", [userinvestmentheaderid, schemeId, schemeDesc, schemeCategory, allocationPercentage, amount, creation_date, modified_date, req.session.user.name, userinvestmentorderid, schemeCode],
							function (err, result2) {
								if (err) {
									console.log("cant insert assets header allocation data", err);
									res.send("false");
								} else {
									//res.send(1);
									console.log("User investment details" + result2.rows);


									if (x >= y) {
										//							console.log("inside callback"+i)
										//							console.log("inside callback x"+x)
										//							console.log("inside callback y"+y)
										callback(null, x)
									}
									x++;

									console.log("inside loop x" + x)
									console.log("inside loop y" + y)





								}


							});


					}


				}
			},
			function (x, callback) {


				//get the password for the order creation 

				var options = {
					method: 'POST',
					url: 'http://bsestarmfdemo.bseindia.com/MFOrderEntry/MFOrder.svc',
					headers: {
						'cache-control': 'no-cache',
						'content-type': 'application/soap+xml; charset=utf-8'
					},
					body: '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="http://bsestarmf.in/" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">\n   <soap:Header>\n   <a:Action >http://bsestarmf.in/MFOrderEntry/getPassword</a:Action>\n   <a:To>http://bsestarmfdemo.bseindia.com/MFOrderEntry/MFOrder.svc</a:To>\n   </soap:Header>\n   <soap:Body>\n      <ns:getPassword  xmlns="http://bsestarmf.in/MFOrderEntry/getPassword">\n         <ns:UserId>109401</ns:UserId>\n          <ns:Password>123456</ns:Password>\n         <ns:PassKey>test</ns:PassKey>\n      </ns:getPassword>\n   </soap:Body>\n</soap:Envelope>'
				};

				request(options, function (error, response, body) {
					if (error) throw new Error(error);

					parseString(body, function (err, results) {
						// Get The Result From The Soap API and Parse it to JSON

						//	console.log(buffer);
						//
						var password = results["s:Envelope"]["s:Body"][0]["getPasswordResponse"][0]["getPasswordResult"][0];
						//console.log("myFault"+results["Fault"]["Reason"][0]["Text"]);
						orderBsePassArray = password.toString().split("|");
						console.log("Order ENtry Service Password " + orderBsePassArray[1]);
						callback(null, orderBsePassArray[1])

					})

				});





			},
			function (pass, callback) {

				var len = req.session.savedplandetail1.length;

				x = 1; y = len;

				//order entry
				for (i = 0; i < len; i++) {


					console.log("init x" + x);
					console.log("init" + y);


					var amount = req.session.savedplandetail1[i].allocationamount;

					console.log("bse" + i);
					var transCode = "NEW";
					var transNo = req.session.bsetxn1[i];
					var orderId = "";
					var clientCode = "SOHANDEMO2";
					var schemeCode = req.session.savedplandetail1[i].schemecode;
					var buySell = "P";
					var buySellType = "FRESH";
					var DPTxn = "P";
					var orderValue = amount;
					var quantity = "";
					var allRedeem = "N";
					var folioNo = "";
					var remarks = "";
					var KYCStatus = "Y";
					var refNo = "";
					var subBrCode = "";
					var EUIN = "E123456";
					var EUINVal = "Y";
					var minRedeem = "N";
					var DPC = "N";
					var IPAdd = "";

					console.log("transactionNo" + transNo[i]);
					var orderBody = '<ns:TransCode>' + transCode + '</ns:TransCode><ns:TransNo>' + transNo + '</ns:TransNo><ns:OrderId>' + orderId + '</ns:OrderId><ns:UserID>' + userID + '</ns:UserID><ns:MemberId>' + memberID + '</ns:MemberId><ns:ClientCode>' + clientCode + '</ns:ClientCode><ns:SchemeCd>' + schemeCode + '</ns:SchemeCd><ns:BuySell>' + buySell + '</ns:BuySell><ns:BuySellType>' + buySellType + '</ns:BuySellType><ns:DPTxn>' + DPTxn + '</ns:DPTxn><ns:OrderVal>' + orderValue + '</ns:OrderVal><ns:Qty>' + quantity + '</ns:Qty><ns:AllRedeem>' + allRedeem + '</ns:AllRedeem><ns:FolioNo>' + folioNo + '</ns:FolioNo><ns:Remarks>' + remarks + '</ns:Remarks><ns:KYCStatus>' + KYCStatus + '</ns:KYCStatus><ns:RefNo>' + refNo + '</ns:RefNo><ns:SubBrCode>' + subBrCode + '</ns:SubBrCode><ns:EUIN>' + EUIN + '</ns:EUIN><ns:EUINVal>' + EUINVal + '</ns:EUINVal><ns:MinRedeem>' + minRedeem + '</ns:MinRedeem><ns:DPC>' + DPC + '</ns:DPC><ns:IPAdd>' + IPAdd + '</ns:IPAdd><ns:Password>' +
						pass + '</ns:Password><ns:PassKey>' + passKey + '</ns:PassKey><ns:Parma1></ns:Parma1><ns:Param2></ns:Param2><ns:Param3></ns:Param3>';

					var options = {
						method: 'POST',
						url: 'http://bsestarmfdemo.bseindia.com/MFOrderEntry/MFOrder.svc',
						headers: {
							'cache-control': 'no-cache',
							'content-type': 'application/soap+xml; charset=utf-8'
						},
						body: '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="http://bsestarmf.in/" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">\n   <soap:Header>\n   <a:Action >http://bsestarmf.in/MFOrderEntry/orderEntryParam</a:Action>\n   <a:To>http://bsestarmfdemo.bseindia.com/MFOrderEntry/MFOrder.svc</a:To>\n   </soap:Header>\n   <soap:Body>\n      <ns:orderEntryParam  xmlns="http://bsestarmf.in/MFOrderEntry/orderEntryParam">\n         ' + orderBody + '  </ns:orderEntryParam>\n   </soap:Body>\n</soap:Envelope>'
					};

					console.log("in loop" + req.session.savedplandetail1[i].allocationdescription);

					request(options, function (error, response, body) {
						if (error) throw new Error(error);


						parseString(body, function (err, results) {
							// Get The Result From The Soap API and Parse it to JSON

							//	console.log(buffer);
							//
							var orderResponse = results["s:Envelope"]["s:Body"][0]["orderEntryParamResponse"][0]["orderEntryParamResult"];
							bseOrderArray = orderResponse.toString().split("|");
							console.log("Transaction code - " + bseOrderArray[0]);
							console.log("Unique Reference Number - " + bseOrderArray[1]);
							console.log("Order Number - " + bseOrderArray[2]);
							console.log("UserId - " + bseOrderArray[3]);
							console.log("MemberId - " + bseOrderArray[4]);
							console.log("Client Code - " + bseOrderArray[5]);
							console.log("BSE Remarks - " + bseOrderArray[6]);
							console.log("Flag - " + bseOrderArray[7]);
							var bseStatus;
							if (bseOrderArray[7] == 1)
								bseStatus = "failure";
							else
								bseStatus = "success";

							var bseTransactionReference = bseOrderArray[1];
							var bseOrderReference = bseOrderArray[2];


							if (x <= y) {

								var query = client.query("UPDATE userinvestmentorders SET bseorderreference = $1, bsestatus = $2 WHERE bsetxnreference =$3 ", [bseOrderReference, bseStatus, bseTransactionReference], function (err, result1) {
									if (err) {
										console.log("cant insert assets header allocation data", err);
										res.send("false");
									} else {


										if (x >= y) {
											//							
											callback(null)
										}
										x++;

										console.log("inside loop x" + x)
										console.log("inside loop y" + y)

									}


								});



							} else {

								console.log("count is more than the expected value" + x + "length" + y);
							}





						})

					});


				}

			},
			function (callback) {

				console.log("I am the payment ");
				//get Password for Payment Link
				var options = {
					method: 'POST',
					url: 'http://bsestarmfdemo.bseindia.com/MFUploadService/MFUploadService.svc/Basic',
					headers: {
						'cache-control': 'no-cache',
						'content-type': 'application/soap+xml; charset=utf-8'
					},
					body: '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="http://bsestarmfdemo.bseindia.com/2016/01/" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">\n   <soap:Header>\n   <a:Action >http://bsestarmfdemo.bseindia.com/2016/01/IMFUploadService/getPassword</a:Action>\n   <a:To>http://bsestarmfdemo.bseindia.com/MFUploadService/MFUploadService.svc/Basic</a:To>\n   </soap:Header>\n   <soap:Body>\n      <ns:getPassword  xmlns="http://bsestarmfdemo.bseindia.com/2016/01/IMFUploadService/getPassword">\n         <ns:UserId>109401</ns:UserId>\n         <ns:MemberId>10940</ns:MemberId>\n         <ns:Password>123456</ns:Password>\n         <ns:PassKey>test</ns:PassKey>\n      </ns:getPassword>\n   </soap:Body>\n</soap:Envelope>'
				};

				request(options, function (error, response, body) {
					if (error) throw new Error(error);

					parseString(body, function (err, results) {
						// Get The Result From The Soap API and Parse it to JSON

						//	console.log(buffer);
						//
						var password = results["s:Envelope"]["s:Body"][0]["getPasswordResponse"][0]["getPasswordResult"][0];
						//console.log("myFault"+results["Fault"]["Reason"][0]["Text"]);
						bsePassArray = password.toString().split("|");
						console.log("MFUPload Service Password " + bsePassArray[1]);
						callback(null, bsePassArray[1])

					})

				});


			},
			function (uploadPass, callback) {



				//make the payment 


				var options = {
					method: 'POST',
					url: 'http://bsestarmfdemo.bseindia.com/MFUploadService/MFUploadService.svc/Basic',
					headers: {
						'cache-control': 'no-cache',
						'content-type': 'application/soap+xml; charset=utf-8'
					},
					body: '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="http://bsestarmfdemo.bseindia.com/2016/01/" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">\n   <soap:Header>\n   <a:Action >http://bsestarmfdemo.bseindia.com/2016/01/IMFUploadService/MFAPI</a:Action>\n   <a:To>http://bsestarmfdemo.bseindia.com/MFUploadService/MFUploadService.svc/Basic</a:To>\n   </soap:Header>\n   <soap:Body>\n      <ns:MFAPI  xmlns="http://bsestarmfdemo.bseindia.com/2016/01/IMFUploadService/MFAPI">\n         <ns:Flag>03</ns:Flag>\n		 <ns:UserId>109401</ns:UserId>\n         <ns:EncryptedPassword>' + uploadPass + '</ns:EncryptedPassword>\n         <ns:param>10940|SOHANDEMO2|http://localhost:3000/BsePaymentStatus</ns:param>\n            </ns:MFAPI>\n   </soap:Body>\n</soap:Envelope>'
				};

				request(options, function (error, response, body) {
					if (error) throw new Error(error);

					parseString(body, function (err, results) {
						// Get The Result From The Soap API and Parse it to JSON

						//console.log(results);
						//
						var link = results["s:Envelope"]["s:Body"][0]["MFAPIResponse"][0]["MFAPIResult"][0];
						//console.log("myFault"+results["Fault"]["Reason"][0]["Text"]);
						bseLinkArray = link.toString().split("|");
						console.log("Payment link " + bseLinkArray[1]);
						// callback(null,bseLinkArray[1])
						res.render('bseRedirect', { data: bseLinkArray[1] });

					})

				});


			}],
			function (err, result) {

				if (err)
					throw err;




			})



	});

	app.post('/Discard', isLoggedIn, function (req, res) {

		var query = client.query("update savedplansheader set status=$1 where savedplanid=$2", ['inactive', req.body.savedplanid], function (err, result) {
			if (err) {
				console.log("cant insert assets header allocation data", err);
				res.send("false");
			} else {
				//res.send(1);
				// console.log("savedplanid"+result.rows[0]['savedplanid']);

				//callback(null,result.rows[0]['savedplanid'])
				res.send("true");
			}


		});

	});

	app.post('/PANValidation', isLoggedIn, function (req, res) {

		loginStatus = checkLoginStatus(req);

		if (loginStatus) {


			password = "web@12345";
			passKey = "test";
			//PAN = "AABCD2345E";
			PAN = req.body.pan;
			username = "WEBINTMM";
			POSCODE = "MONEYMATTER";
			var ePass = ""; //= "FjFMCDg4YPtsxrGRtJmeVQ%3d%3d";

			async.waterfall([
				function (callback) {

					var optionsForPassword = {
						hostname: "test.cvlkra.com",
						path: '/PANInquiry.asmx/GetPassword?password=' + password + '&PassKey=' + passKey
					};

					var getPassword = http.get(optionsForPassword, function (response) {
						var encryptedPassword = '';
						response.on('data', function (chunk) {
							encryptedPassword += chunk;
						});
						response.on('end', function () {
							// console.log(encryptedPassword);
							parseString(encryptedPassword, function (err, result) {
								//tot = 	JSON.stringify(result)
								// console.log(result["string"]["_"]);
								console.log(result);
								ePass = result["string"]["_"];
								callback(null, ePass)
							});
						})
					}).on('error', function (e) {
						console.log('problem with request: ' + e.message);
						callback(false)
					});

				},
				function (ePass, callback) {

					// get the PAN Status
					var optionsForPANStaus = {
						hostname: "test.cvlkra.com",
						path: '/PANInquiry.asmx/GetPanStatus?panNo=' + PAN + '&userName=' + username + '&PosCode=' + POSCODE + '&password=' + ePass + '&PassKey=' + passKey
						//path: '/PANInquiry.asmx/GetPanStatus?panNo=BDKPS1141N&userName=WEBINTMM&PosCode=MONEYMATTER&password='+ePass+'&PassKey='+passKey
					};

					var getPANStatus = http.get(optionsForPANStaus, function (response) {
						var statusPAN = '';
						response.on('data', function (chunk) {
							statusPAN += chunk;
						});
						response.on('end', function () {
							// console.log(statusPAN);
							parseString(statusPAN, function (err, result1) {
								//console.log(result1.APP_RES_ROOT.APP_PAN_INQ[0].APP_PAN_NO[0]);
								//console.log(result1.APP_RES_ROOT);
								appStatus = result1.APP_RES_ROOT.APP_PAN_INQ[0].APP_STATUS[0];
								//console.log(appStatus);
								//callback()

								panData = result1.APP_RES_ROOT.APP_PAN_INQ[0].APP_NAME[0];
								panNo = result1.APP_RES_ROOT.APP_PAN_INQ[0].APP_PAN_NO[0];

								msg = "";
								switch (appStatus) {

									case "000": msg = "Not Checked with respective KRA";
										break;
									case "001": msg = "Submitted";
										break;
									case "002": msg = "KRA Verified";
										break;
									case "003": msg = "Hold";
										break;

									case "004": msg = "Rejected";
										break;
									case "005": msg = "Not available";
										break;
									case "006": msg = "Deactivated";
										break;
									case "011": msg = "Existing KYC Submitted";
										break;
									case "012": msg = "Existing KYC Verified";
										break;
									case "013": msg = "Existing KYC hold";
										break;
									case "014": msg = "Existing KYC Rejected";
										break;
									case "022": msg = "KYC REGISTERED WITH CVLMF";
										break;
									case "888": msg = " Not Checked with Multiple KRA";
										break;
									case "999": msg = "Invalid PAN NO Format";
										break;
								}

								data = {
									"statusCode": appStatus,
									"msg": msg,
									"pan": panNo,
									"name": panData
								}

								var panJSON = JSON.stringify(data);
								//console.log(panJSON+"dad")
								callback(null, panJSON)

							});
						})
					}).on('error', function (e) {
						console.log('problem with request: ' + e.message);
					});


				}], function (err, result) {
					// result is 'd'  
					if (err)
						throw err;

					//console.log(result+"inside ur");

					panMsg = req.session.panMessage = result;
					//console.log(panMsg+"assigned");
					res.send(panMsg);
				}
			)

		}


	});

	app.post('/SavedPlansHeader', isLoggedIn, function (req, res) {
		loginStatus = checkLoginStatus(req);
		if (loginStatus) {
			var creation_date = new Date();
			var modified_date = new Date();
			var status = 'active';
			console.log('body: ' + req.body);
			async.waterfall([
				function (callback) {
					var query = client.query("select goalid from goal where goal.name=$1", [req.body.goalName], function (err, result) {
						if (err) {
							console.log("cant insert assets header allocation data", err);
							res.send("false");
						} else {
							//res.send(1);
							console.log("goalid" + result.rows[0]['goalid']);
							callback(null, result.rows[0]['goalid'])
						}
					});
				},

				function (goalid, callback) {
					console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>SavedPlanHeader');
					console.log(req.session.user.userid);
					console.log(goalid);
					console.log(req.body.riskProfile);
					console.log(req.body.masterAmount);
					console.log(req.body.totalYears);
					console.log(req.body.sip);
					//insert to the saved plans header
					var query = client.query("INSERT INTO savedplansheader(userid,goalid,riskprofile, masteramount, totalyears, sip,status,created,modified,createdby) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING savedplanid", [req.session.user.userid, goalid, req.body.riskProfile, req.body.masterAmount, req.body.totalYears, req.body.sip, status, creation_date, modified_date, req.session.user.name], function (err, result) {
							if (err) {
								console.log("cant insert assets header allocation data", err);
								res.send("false");
							} else {
								//res.send(1);
								console.log("savedplanid" + result.rows[0]['savedplanid']);
								callback(null, result.rows[0]['savedplanid'])
							}
						});
				},
				function (savedPlanId, callback) {
					//insert to the saved plans details
					var percentage = [req.body.equityPercentage, req.body.hybridPercentage, req.body.debtPercentage];
					var amount = [req.body.equityAmount, req.body.hybridAmount, req.body.debtAmount];
					console.log('I m here>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
					console.log(percentage[0]);
					console.log(percentage[1]);
					console.log(percentage[2]);
					console.log(amount[0]);
					console.log(amount[1]);
					console.log(amount[2]);

					var type = 'allocation';
					var category = ['Equity', 'Hybrid', 'Debt'];
					console.log("id=" + savedPlanId);
					/*,(savedPlanId,type,category[1],category[1],percentage[1],amount[1],creation_date,modified_date,req.session.user.name),(savedPlanId,type,category[2],category[2],percentage[2],amount[2],creation_date,modified_date,req.session.user.name)*/
					var query = client.query("INSERT INTO savedplansdetail(savedplanid,allocationtype,allocationcategory, allocationdescription, allocationpercentage, allocationamount,created,modified,createdby) values($1,$2,$3,$4,$5,$6,$7,$8,$9),($10,$11,$12,$13,$14,$15,$16,$17,$18),($19,$20,$21,$22,$23,$24,$25,$26,$27)",[savedPlanId, type, category[0], category[0], percentage[0], amount[0], creation_date, modified_date, req.session.user.name, savedPlanId, type, category[1], category[1], percentage[1], amount[1], creation_date, modified_date, req.session.user.name, savedPlanId, type, category[2], category[2], percentage[2], amount[2], creation_date, modified_date, req.session.user.name]
						, function (err, result) {
							if (err) {
								console.log("cant insert assets detail allocation data", err);
								res.send("false");
							} else {
								console.log(result.rows);
								callback(null)
							}
						});
				}],
				function (err, result) {
					if (err)
						throw err;
					async.waterfall([function (callback) {
						//Fetch Header 
						//store the data in a json
						var query = client.query("SELECT * FROM savedplansheader where userid=$1 ORDER BY created DESC LIMIT 1 ", [req.session.user.userid],
							function (err, result) {
								if (err)
									console.log("Cant get assets values");
								//console.log("saved plan header"+req.session.savedplanheader.sip);
								
								asetData = result.rows[0];
								req.session.savedplanheader = asetData;
								console.log("saved plan header" + req.session.savedplanheader.goalid);
								console.log("saved plan header" + req.session.savedplanheader.riskprofile);
								console.log("saved plan header" + req.session.savedplanheader.masteramount);
								console.log("saved plan header" + req.session.savedplanheader.totalyears);
								console.log("saved plan header" + req.session.savedplanheader.userid);
								callback(null, asetData)
							})
					},
					function (headerData, callback) {
						console.log(headerData)
						var query = client.query("SELECT * FROM savedplansdetail where savedplanid=$1 and allocationtype=$2 ORDER BY created DESC LIMIT 3 ", [headerData.savedplanid, 'allocation'],
							function (err, result) {
								if (err)
									console.log("Cant get assets values");
								asetDataDetail = result.rows;
								console.log(asetDataDetail[1]);
								callback(null, headerData, asetDataDetail)
							})


						//fetch Detail
						//using header id
						//store the data in a json

					}, function (headerData, detailData, callback) {
						console.log("data", headerData.riskprofile);
						//initialize query
						//using the json data
						//pass the query

						var amount = {

							amount1: detailData[0].allocationamount,
							amount2: detailData[1].allocationamount,
							amount3: detailData[2].allocationamount

						}
						//console.log(amount);

						var time = headerData.totalyears;
						var sip = headerData.sip;
						var riskProfile = headerData.riskprofile;
						// callback(null,query);


						if (req.body.lumpsum) {

							console.log("lumpsum" + req.body.lumpsum);
							var amt = [];
							amt[0] = req.body.masterAmount;

							var query = client.query("select * from lumpsum_schemes where $1 between fromamount and toamount and $2 between fromyear and toyear and riskprofile = $3", [req.body.masterAmount, time, riskProfile],
								function (err, result) {
									if (err)
										console.log("Cant get assets values");

									scheme = result.rows;
									console.log("daadadadadadadad" + scheme.length)
									for (i = 0; i < scheme.length; i++) {
										var percentage = 100;
										var type = 'scheme';
										var category = scheme[i].category;
										var schemeDescription = scheme[i].name;
										var schemeCode = scheme[i].code;
										var schemeId = scheme[i].lumpsumschemeid;
										console.log(scheme[i].code);
										// var schemeCode = scheme[i].code;
										creation_date = new Date();
										modified_date = new Date();
										console.log("amt="+amt[i]);
										/*req.session.savedplandetail[i].allocationamount = amt[0];
										 req.session.savedplandetail[i].schemecode = schemeCode;
										req.session.savedplandetail[i].allocationdescription = schemeDescription;
										req.session.savedplandetail[i].allocationcategory = category;
										req.session.savedplandetail[i].allocationpercentage = percentage;
										req.session.savedplandetail[i].schemeid = schemeId;*/

										var query = client.query("INSERT INTO savedplansdetail(savedplanid,allocationtype,allocationcategory, allocationdescription, allocationpercentage, allocationamount,created,modified,createdby,schemecode,schemeid) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)", [headerData.savedplanid, type, category, schemeDescription, percentage, req.body.masterAmount, creation_date, modified_date, req.session.user.name, schemeCode, schemeId]
											, function (err, result) {
												if (err) {
													console.log("cant insert assets detail allocation data", err);
													// res.send("false");
												} else {
													//res.send(1);
													console.log("result" + req.body.masterAmount);
													//callback(null)
												}
											});
									}
									//calculateScheme();
									//res.redirect("/Pricing");
									callback(null, amt);
								})
						} else {
							var schemecamntde = 0, schemecamnteq = 0, schemecamnthy = 0;
							var schememamntde = 0, schememamnteq = 0, schememamnthy = 0;
							var schemeagamnthy = 0, schemeagamnteq = 0, schemeagamnteq = 0;
							//select * from schemesmaster where $1 between sipfrom and sipto and $2 between yearfrom and yearto and riskprofile = $3
							var j = 0, k = 0, l = 0;
							var query = client.query("select * from schemesmaster where $1 between sipfrom and sipto and $2 between yearfrom and yearto and riskprofile = $3 order by category ", [sip, time, riskProfile],
								function (err, result) {
									if (err)
										console.log("Cant get assets values");
									scheme = result.rows;
									//console.log(scheme.length+"scheme"+scheme[1].name+scheme[1].category+"schemecode"+scheme[1].code);

									for (i = 0; i < scheme.length; i++) {

										if ((scheme[i].category) == "Equity") {
											j = j + 1;
										}

										if ((scheme[i].category) == "Hybrid") {
											k = k + 1;
										}

										if ((scheme[i].category) == "Debt") {
											l = l + 1;
										}



									}
									console.log("j" + j + "k" + k + "l" + l);


									for (i = 0; i < scheme.length; i++) {

										if (j == 0 || j == 1) {
											schemecamnteq = amount.amount1;
										}
										else {
											schemecamnteq = amount.amount1 / j;
										}
										if (k == 0 || k == 1) {
											schemecamnthy = amount.amount2;
										}
										else {
											schemecamnthy = amount.amount2 / k;
										}
										if (l == 0 || l == 1) {
											schemecamntde = amount.amount3;
										} else {
											schemecamntde = amount.amount3 / l;
										}
									}

									console.log("Equity" + schemecamnteq + "Hybrid" + schemecamnthy + "Debt" + schemecamntde);

									var schemeAmount = {

										equityAmt: schemecamnteq,
										hybridAmt: schemecamnthy,
										debtAmt: schemecamntde

									}

									var amt = [];

									for (i = 0; i < scheme.length; i++) {



										if (scheme[i].riskprofile == "Aggressive") {

											var amtamount1 = 0, amtmd4 = 0;




											if ((scheme[i].category) == "Equity") {
												var amtamount2 = 0, remainamt = 0, amtremainadded = 0, amtagg = 0;

												var amtrounded1 = 0, amtrounded2 = 0, amtrounded5 = 0;



												//remainamt=amount.amount1-totalrounded;


												console.log("Equity j value", j);

												for (var n = 0; n < j; n++) {
													amtrounded5 = Math.floor((schemecamnteq) / 1000) * 1000;
													amtamount1 = schemecamnteq - amtrounded5;
													amtagg += amtamount1;
													console.log("Equity rating 1", amtagg, amtrounded5);

												}


												if ((scheme[i].rating) >= 2) {

													console.log("Equity in schemes", amtrounded5);
													amt[i] = amtrounded5;
												}
												if ((scheme[i].rating) == 1) {
													console.log("Equity in schemes" + amtrounded5);
													var amountagg = amtrounded5 + amtagg;
													amountagg = Math.round((amountagg) / 1000) * 1000;
													amt[i] = amountagg;
												}

												if ((scheme[i].rating) == 0) {
													console.log("Equity" + schemecamnteq);
													amt[i] = schemecamnteq;
												}



											}

											var amtamount1 = 0, amtmd4 = 0, amtrounded1 = 0;
											if ((scheme[i].category) == "Hybrid") {
												var amtamount2 = 0;
												amtrounded1 = Math.floor((schemecamnthy) / 1000) * 1000;
												amtamount1 = schemecamnthy - amtrounded1;
												amtamount1 += amtamount1;

												amtmd4 = schemecamnthy + amtamount1;
												amt7 = Math.round(amtmd4 / 1000) * 1000;
												if ((scheme[i].rating) >= 1) {
													if ((scheme[i].rating) > 1) {

														console.log("Hybrid" + amtrounded1);
														amt[i] = amtrounded1;
													}

													if ((scheme[i].rating) == 1) {

														console.log("Hybrid" + amt7);
														amt[i] = amt7;
													}
												}
												if ((scheme[i].rating) == 0) {
													console.log("Hybrid" + schemecamnthy);
													amt[i] = schemecamnthy;
												}



											}


											var amtamount1 = 0, amtmd4 = 0, amtrounded1 = 0;
											if ((scheme[i].category) == "Debt") {
												var amtamount2 = 0;
												amtrounded1 = Math.floor((schemecamntde) / 1000) * 1000;
												amtamount1 = schemecamntde - amtrounded1;
												amtamount1 += amtamount1;
												amtmd4 = schemecamntde + amtamount1;
												amt8 = Math.round(amtmd4 / 1000) * 1000;
												if ((scheme[i].rating) >= 1) {
													if ((scheme[i].rating) > 1) {

														console.log("Debt" + amtrounded1);
														amt[i] = amtrounded1;
													}
													if ((scheme[i].rating) == 1) {

														console.log("Debt" + amt8);
														amt[i] = amt8;
													}
												}
												if ((scheme[i].rating) == 0) {

													console.log("Debt" + schemecamntde);
													amt[i] = schemecamntde;
												}

											}





										} else {

											var amtrounded1 = 0;
											if ((scheme[i].category) == "Equity") {



												if ((scheme[i].rating) > 1) {
													amtrounded1 = Math.floor((schemecamnteq) / 1000) * 1000;
													console.log("Equity" + amtrounded1);
													amt[i] = amtrounded1;

												}
												if ((scheme[i].rating) == 1) {
													amtme1 = Math.round(schemecamnteq / 1000) * 1000;
													console.log("Equity" + amtme1);
													amt[i] = amtme1;
												}
												if ((scheme[i].rating) == 0) {
													console.log("Equity" + schemecamnteq);
													amt[i] = schemecamnteq;
												}


											}
											var amtamount1 = 0, amtmd4 = 0, amtrounded1 = 0;
											if ((scheme[i].category) == "Hybrid") {

												if ((scheme[i].rating) > 1) {
													amtrounded1 = Math.floor((schemecamnthy) / 1000) * 1000;
													console.log("Hybrid" + amtrounded1);
													amt[i] = amtrounded1;
												}
												if ((scheme[i].rating) == 1) {

													amtme1 = Math.round(schemecamnthy / 1000) * 1000;
													console.log("Hybrid" + amtme1);
													amt[i] = amtme1;
												}
												if ((scheme[i].rating) == 0) {
													console.log("Hybrid" + schemecamnthy);
													amt[i] = schemecamnthy;
												}


											}
											var amtamount1 = 0, amtmd4 = 0, amtrounded1 = 0;
											if ((scheme[i].category) == "Debt") {

												if ((scheme[i].rating) > 1) {
													amtrounded1 = Math.floor((schemecamntde) / 1000) * 1000;

													console.log("Debt" + amtrounded1);
													amt[i] = amtrounded1;

												}
												if ((scheme[i].rating) == 1) {
													amtme4 = Math.round(schemecamntde / 1000) * 1000;
													console.log("Debt" + amtme4);
													amt[i] = amtme4;
												}
												if ((scheme[i].rating) == 0) {
													console.log("Debt" + schemecamntde);
													amt[i] = schemecamntde;
												}





											}
										}
									}

									//insert into the details

									/*var	schemeData = {[
													  
													  ]}
													
												var panJSON = JSON.stringify(data);	*/


									for (i = 0; i < scheme.length; i++) {

										var percentage = 0;

										var type = 'scheme';
										var category = scheme[i].category;
										var schemeDescription = scheme[i].name;
										var schemeCode = scheme[i].code;
										var schemeId = scheme[i].schemeid;
										console.log(scheme[i].code);
										// var schemeCode = scheme[i].code;
										creation_date = new Date();
										modified_date = new Date();
										console.log("amt=" + amt[i]);

										/*,(savedPlanId,type,category[1],category[1],percentage[1],amount[1],creation_date,modified_date,req.session.user.name),(savedPlanId,type,category[2],category[2],percentage[2],amount[2],creation_date,modified_date,req.session.user.name)*/

										var query = client.query("INSERT INTO savedplansdetail(savedplanid,allocationtype,allocationcategory, allocationdescription, allocationpercentage, allocationamount,created,modified,createdby,schemecode,schemeid) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)", [headerData.savedplanid, type, category, schemeDescription, percentage, amt[i], creation_date, modified_date, req.session.user.name, schemeCode, schemeId]
											, function (err, result) {
												if (err) {
													console.log("cant insert assets detail allocation data", err);
													//res.send("false");
												} else {
													//res.send(1);
													console.log("result" + result.rows);

													//callback(null)

												}


											});

									}


									//calculateScheme();
									//res.redirect("/Pricing");
									callback(null, amt);


								})
						}
						//fetch the scheme info

					}], function (err, amount) {



						var query = client.query("SELECT * FROM savedplansdetail where savedplanid=$1 and allocationtype=$2", [req.session.savedplanheader.savedplanid, 'scheme'],
							function (err, result) {
								if (err)
									console.log("Cant get assets values");
								
								var asetDataDetail = result.rows;
								req.session.savedplandetail = asetDataDetail;

								var sdata = [];
								sdata[0] = scheme;

								sdata[1] = amount;
								//	console.log("lumpsum amount"+req.session.savedplandetail[0].allocationamount)
								res.send(sdata)
								//callback(null,headerData,asetDataDetail)
							})


						//dislay the scheme information
					})




				}

			)

		}
		else {
			//	console.log('body: you are not loggedIn' );
			res.send(0);

		}





	});

	app.post('/showScheme', isLoggedIn, function (req, res) {

		req.session.showscheme = req.body.showScheme;

		console.log("scheme pa = " + req.session.showscheme);

		res.send(true);
		//res.redirect('/GoalSelection');

	});

	app.post('/setData', function (req, res) {


		req.session.offlinegoalName = req.body.goalName;
		req.session.offlineriskProfile = req.body.riskProfile;
		req.session.offlinemasterAmount = req.body.masterAmount;
		req.session.offlinetotalYears = req.body.totalYears;
		req.session.offlinesip = req.body.sip;
		req.session.offlineequityAmount = req.body.equityAmount;
		req.session.offlinehybridAmount = req.body.hybridAmount;
		req.session.offlinedebtAmount = req.body.debtAmount;
		req.session.offlineequityPercentage = req.body.equityPercentage;
		req.session.offlinehybridPercentage = req.body.hybridPercentage;
		req.session.offlinedebtPercentage = req.body.debtPercentage;


		req.session.save();
		console.log("offline = " + req.session.offlinegoalName);
		console.log("offline = " + req.session.offlineriskProfile);

	})

	app.post('/showScheme', isLoggedIn, function (req, res) {

		req.session.showscheme = req.body.showScheme;

		console.log("scheme pa = " + req.session.showscheme);

		res.send(true);
		//res.redirect('/GoalSelection');

	})

	app.post('/setData', function (req, res) {


		req.session.offlinegoalName = req.body.goalName;
		req.session.offlineriskProfile = req.body.riskProfile;
		req.session.offlinemasterAmount = req.body.masterAmount;
		req.session.offlinetotalYears = req.body.totalYears;
		req.session.offlinesip = req.body.sip;
		req.session.offlineequityAmount = req.body.equityAmount;
		req.session.offlinehybridAmount = req.body.hybridAmount;
		req.session.offlinedebtAmount = req.body.debtAmount;
		req.session.offlineequityPercentage = req.body.equityPercentage;
		req.session.offlinehybridPercentage = req.body.hybridPercentage;
		req.session.offlinedebtPercentage = req.body.debtPercentage;


		req.session.save();
		console.log("offline = " + req.session.offlinegoalName);
		console.log("offline = " + req.session.offlineriskProfile);

	})

	app.get('/saveAssetOffline', isLoggedIn, function (req, res) {

		console.log("offline save = " + req.session.offlinegoalName);

		if (req.session.offlinegoalName) {
			//store data



			if (!loginStatus) {

				var creation_date = new Date();
				var modified_date = new Date();
				var status = 'active';
				console.log('body:ofline ' + req.session.offlinegoalName);


				async.waterfall([
					function (callback) {

						var query = client.query("select goalid from goal where goal.name=$1", [req.session.offlinegoalName], function (err, result) {
							if (err) {
								console.log("cant insert assets header allocation data", err);
								res.send("false");
							} else {
								//res.send(1);
								console.log("goalid" + result.rows[0]['goalid']);

								callback(null, result.rows[0]['goalid'])
							}


						});

					},


					function (goalid, callback) {

						//insert to the saved plans header

						console.log("mA0" + req.session.offlinemasterAmount);
						var query = client.query("INSERT INTO savedplansheader(userid,goalid,riskprofile, masteramount, totalyears, sip,status,created,modified,createdby) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING savedplanid", [req.session.user.userid, goalid, req.session.offlineriskProfile, req.session.offlinemasterAmount, req.session.offlinetotalYears, req.session.offlinesip, status,
							creation_date, modified_date, req.session.user.name], function (err, result) {
								if (err) {
									console.log("cant insert assets header allocation data", err);
									res.send("false");
								} else {
									//res.send(1);
									console.log("savedplanid" + result.rows[0]['savedplanid']);

									callback(null, result.rows[0]['savedplanid'])
								}
							});
					},
					function (savedPlanId, callback) {

						//insert to the saved plans details
						var percentage = [req.session.offlineequityPercentage, req.session.offlinehybridPercentage, req.session.offlinedebtPercentage];
						var amount = [req.session.offlineequityAmount, req.session.offlinehybridAmount, req.session.offlinedebtAmount];
						var type = 'allocation';
						var category = ['Equity', 'Hybrid', 'Debt'];

						console.log("id=" + savedPlanId);

						/*,(savedPlanId,type,category[1],category[1],percentage[1],amount[1],creation_date,modified_date,req.session.user.name),(savedPlanId,type,category[2],category[2],percentage[2],amount[2],creation_date,modified_date,req.session.user.name)*/

						var query = client.query("INSERT INTO savedplansdetail(savedplanid,allocationtype,allocationcategory, allocationdescription, allocationpercentage, allocationamount,created,modified,createdby) values($1,$2,$3,$4,$5,$6,$7,$8,$9),($10,$11,$12,$13,$14,$15,$16,$17,$18),($19,$20,$21,$22,$23,$24,$25,$26,$27)", [savedPlanId, type, category[0], category[0], percentage[0], amount[0], creation_date, modified_date, req.session.user.name, savedPlanId, type, category[1], category[1], percentage[1], amount[1], creation_date, modified_date, req.session.user.name, savedPlanId, type, category[2], category[2], percentage[2], amount[2], creation_date, modified_date, req.session.user.name]
							, function (err, result) {
								if (err) {
									console.log("cant insert assets detail allocation data", err);
									res.send("false");
								} else {
									//res.send(1);
									// console.log(result.rows[0]);
									callback(null)
								}
							});
					}],
					function (err, result) {

						if (err)
							throw err;

						async.waterfall([function (callback) {

							//Fetch Header 
							//store the data in a json
							var query = client.query("SELECT * FROM savedplansheader where userid=$1 ORDER BY created DESC LIMIT 1 ", [req.session.user.userid],
								function (err, result) {
									if (err)
										console.log("Cant get assets values");



									asetData = result.rows[0];
									callback(null, asetData)
								})


						},
						function (headerData, callback) {
							console.log(headerData)



							var query = client.query("SELECT * FROM savedplansdetail where savedplanid=$1 and allocationtype=$2 ORDER BY created DESC LIMIT 3 ", [headerData.savedplanid, 'allocation'],
								function (err, result) {
									if (err)
										console.log("Cant get assets values");



									asetDataDetail = result.rows;
									console.log(asetDataDetail[1]);


									callback(null, headerData, asetDataDetail)
								})


							//fetch Detail
							//using header id
							//store the data in a json

						}, function (headerData, detailData, callback) {

							console.log("data", headerData.riskprofile);
							//initialize query
							//using the json data
							//pass the query

							var amount = {

								amount1: detailData[0].allocationamount,
								amount2: detailData[1].allocationamount,
								amount3: detailData[2].allocationamount

							}
							//console.log(amount);

							var time = headerData.totalyears;
							var sip = headerData.sip;
							var riskProfile = headerData.riskprofile;
							// callback(null,query);


							var schemecamntde = 0, schemecamnteq = 0, schemecamnthy = 0;
							var schememamntde = 0, schememamnteq = 0, schememamnthy = 0;
							var schemeagamnthy = 0, schemeagamnteq = 0, schemeagamnteq = 0;
							//select * from schemesmaster where $1 between sipfrom and sipto and $2 between yearfrom and yearto and riskprofile = $3
							var j = 0, k = 0, l = 0;
							var query = client.query("select * from schemesmaster where $1 between sipfrom and sipto and $2 between yearfrom and yearto and riskprofile = $3", [sip, time, riskProfile],
								function (err, result) {
									if (err)
										console.log("Cant get assets values");

									scheme = result.rows;
									//console.log(scheme.length+"scheme"+scheme[1].name+scheme[1].category+"schemecode"+scheme[1].code);


									for (i = 0; i < scheme.length; i++) {


										if ((scheme[i].category) == "Equity") {
											j = j + 1;
										}

										if ((scheme[i].category) == "Hybrid") {
											k = k + 1;
										}

										if ((scheme[i].category) == "Debt") {
											l = l + 1;
										}



									}
									console.log("j" + j + "k" + k + "l" + l);


									for (i = 0; i < scheme.length; i++) {

										if (j == 0 || j == 1) {
											schemecamnteq = amount.amount1;
										}
										else {
											schemecamnteq = amount.amount1 / j;
										}
										if (k == 0 || k == 1) {
											schemecamnthy = amount.amount2;
										}
										else {
											schemecamnthy = amount.amount2 / k;
										}
										if (l == 0 || l == 1) {
											schemecamntde = amount.amount3;
										} else {
											schemecamntde = amount.amount3 / l;
										}
									}

									console.log("Equity" + schemecamnteq + "Hybrid" + schemecamnthy + "Debt" + schemecamntde);

									var schemeAmount = {

										equityAmt: schemecamnteq,
										hybridAmt: schemecamnthy,
										debtAmt: schemecamntde

									}

									var amt = [];

									for (i = 0; i < scheme.length; i++) {



										if (scheme[i].riskprofile == "Aggressive") {

											var amtamount1 = 0, amtmd4 = 0;




											if ((scheme[i].category) == "Equity") {
												var amtamount2 = 0, remainamt = 0, amtremainadded = 0, amtagg = 0;

												var amtrounded1 = 0, amtrounded2 = 0, amtrounded5 = 0;



												//remainamt=amount.amount1-totalrounded;


												console.log("Equity j value", j);

												for (var n = 0; n < j; n++) {
													amtrounded5 = Math.floor((schemecamnteq) / 1000) * 1000;
													amtamount1 = schemecamnteq - amtrounded5;
													amtagg += amtamount1;
													console.log("Equity rating 1", amtagg, amtrounded5);

												}


												if ((scheme[i].rating) >= 2) {

													console.log("Equity in schemes", amtrounded5);
													amt[i] = amtrounded5;
												}
												if ((scheme[i].rating) == 1) {
													console.log("Equity in schemes" + amtrounded5);
													var amountagg = amtrounded5 + amtagg;
													amountagg = Math.round((amountagg) / 1000) * 1000;
													amt[i] = amountagg;
												}

												if ((scheme[i].rating) == 0) {
													console.log("Equity" + schemecamnteq);
													amt[i] = schemecamnteq;
												}



											}

											var amtamount1 = 0, amtmd4 = 0, amtrounded1 = 0;
											if ((scheme[i].category) == "Hybrid") {
												var amtamount2 = 0;
												amtrounded1 = Math.floor((schemecamnthy) / 1000) * 1000;
												amtamount1 = schemecamnthy - amtrounded1;
												amtamount1 += amtamount1;

												amtmd4 = schemecamnthy + amtamount1;
												amt7 = Math.round(amtmd4 / 1000) * 1000;
												if ((scheme[i].rating) >= 1) {
													if ((scheme[i].rating) > 1) {

														console.log("Hybrid" + amtrounded1);
														amt[i] = amtrounded1;
													}

													if ((scheme[i].rating) == 1) {

														console.log("Hybrid" + amt7);
														amt[i] = amt7;
													}
												}
												if ((scheme[i].rating) == 0) {
													console.log("Hybrid" + schemecamnthy);
													amt[i] = schemecamnthy;
												}



											}


											var amtamount1 = 0, amtmd4 = 0, amtrounded1 = 0;
											if ((scheme[i].category) == "Debt") {
												var amtamount2 = 0;
												amtrounded1 = Math.floor((schemecamntde) / 1000) * 1000;
												amtamount1 = schemecamntde - amtrounded1;
												amtamount1 += amtamount1;
												amtmd4 = schemecamntde + amtamount1;
												amt8 = Math.round(amtmd4 / 1000) * 1000;
												if ((scheme[i].rating) >= 1) {
													if ((scheme[i].rating) > 1) {

														console.log("Debt" + amtrounded1);
														amt[i] = amtrounded1;
													}
													if ((scheme[i].rating) == 1) {

														console.log("Debt" + amt8);
														amt[i] = amt8;
													}
												}
												if ((scheme[i].rating) == 0) {

													console.log("Debt" + schemecamntde);
													amt[i] = schemecamntde;
												}

											}





										} else {

											var amtrounded1 = 0;
											if ((scheme[i].category) == "Equity") {



												if ((scheme[i].rating) > 1) {
													amtrounded1 = Math.floor((schemecamnteq) / 1000) * 1000;
													console.log("Equity" + amtrounded1);
													amt[i] = amtrounded1;

												}
												if ((scheme[i].rating) == 1) {
													amtme1 = Math.round(schemecamnteq / 1000) * 1000;
													console.log("Equity" + amtme1);
													amt[i] = amtme1;
												}
												if ((scheme[i].rating) == 0) {
													console.log("Equity" + schemecamnteq);
													amt[i] = schemecamnteq;
												}


											}
											var amtamount1 = 0, amtmd4 = 0, amtrounded1 = 0;
											if ((scheme[i].category) == "Hybrid") {

												if ((scheme[i].rating) > 1) {
													amtrounded1 = Math.floor((schemecamnthy) / 1000) * 1000;
													console.log("Hybrid" + amtrounded1);
													amt[i] = amtrounded1;
												}
												if ((scheme[i].rating) == 1) {

													amtme1 = Math.round(schemecamnthy / 1000) * 1000;
													console.log("Hybrid" + amtme1);
													amt[i] = amtme1;
												}
												if ((scheme[i].rating) == 0) {
													console.log("Hybrid" + schemecamnthy);
													amt[i] = schemecamnthy;
												}


											}
											var amtamount1 = 0, amtmd4 = 0, amtrounded1 = 0;
											if ((scheme[i].category) == "Debt") {

												if ((scheme[i].rating) > 1) {
													amtrounded1 = Math.floor((schemecamntde) / 1000) * 1000;

													console.log("Debt" + amtrounded1);
													amt[i] = amtrounded1;

												}
												if ((scheme[i].rating) == 1) {
													amtme4 = Math.round(schemecamntde / 1000) * 1000;
													console.log("Debt" + amtme4);
													amt[i] = amtme4;
												}
												if ((scheme[i].rating) == 0) {
													console.log("Debt" + schemecamntde);
													amt[i] = schemecamntde;
												}





											}
										}
									}

									//insert into the details

									for (i = 0; i < scheme.length; i++) {

										var percentage = 0;

										var type = 'scheme';
										var category = scheme[i].category;
										var schemeDescription = scheme[i].name;
										var schemeCode = scheme[i].code;
										var schemeId = scheme[i].schemeid;
										console.log(scheme[i].code);
										// var schemeCode = scheme[i].code;
										creation_date = new Date();
										modified_date = new Date();
										console.log("amt=" + amt[i]);

										/*,(savedPlanId,type,category[1],category[1],percentage[1],amount[1],creation_date,modified_date,req.session.user.name),(savedPlanId,type,category[2],category[2],percentage[2],amount[2],creation_date,modified_date,req.session.user.name)*/

										var query = client.query("INSERT INTO savedplansdetail(savedplanid,allocationtype,allocationcategory, allocationdescription, allocationpercentage, allocationamount,created,modified,createdby,schemecode,schemeid) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)", [headerData.savedplanid, type, category, schemeDescription, percentage, amt[i], creation_date, modified_date, req.session.user.name, schemeCode, schemeId]
											, function (err, result) {
												if (err) {
													console.log("cant insert assets detail allocation data", err);
													//res.send("false");
												} else {
													//res.send(1);
													console.log("result" + result.rows);

													//callback(null)

												}


											});
									}



									//calculateScheme();
									//res.redirect("/Pricing");
									callback(null);
								})
							//fetch the scheme info

						}], function (err, result) {


							req.session.showAssetAfterLogin = true;

							req.session.offlinegoalName = null;
							req.session.offlineriskProfile = null;
							req.session.offlinemasterAmount = null;
							req.session.offlinetotalYears = null;
							req.session.offlinesip = null;
							req.session.offlineequityAmount = null;
							req.session.offlinehybridAmount = null;
							req.session.offlinedebtAmount = null;
							req.session.offlineequityPercentage = null;
							req.session.offlinehybridPercentage = null;
							req.session.offlinedebtPercentage = null;
							console.log("save offline")
							console.log("offline unset save = " + req.session.showAssetAfterLogin);
							res.redirect('/tocurrent');
							//dislay the scheme information
						})




					}

				)

			}
			else {

				//	console.log('body: you are not loggedIn' );
				res.redirect('/tocurrent');

			}


		} else {

			console.log("dont save")
			res.redirect('/tocurrent');
		}


	})

	app.get('/YourStory', isLoggedIn, function (req, res) {
		currentPage = req.session.activePage = "/YourStory";

		loginStatus = checkLoginStatus(req);

		mobile = req.useragent["isMobile"];
		if (mobile)
			pageName = "yourStoryMobile";
		else
			pageName = "yourStory";


		res.render(pageName, {

			user: req.user,
			selectorDisplay: "show",
			loggedIn: loginStatus,
			path: 'profileData',
			smessage: req.flash('signupMessage'),
			lmessage: req.flash('loginMessage'),
			footerDisplay: "hide",
			footerData1: "Blog",
			footerData2: "FAQs"
		});
	});

    app.get('/profile',isLoggedIn, function(req, res){
	currentPage = req.session.activePage = "/profile";
	
	  mobile = req.useragent["isMobile"];
    if(mobile)
   		pageName = "profileMobile";
	else
		pageName = "yourStory";
		 
	
	loginStatus = checkLoginStatus(req);
	
    //profile
     
   var query=client.query("select * from users inner join profile on users.userid = profile.userid where users.userid=$1",[req.session.user.userid],function(err,result){
            if(err)
                console.log("Cant get profile details from users table");
            if(result.rows.length>0)
                {
                    
                    var len=result.rows.length;
    
                    console.log("Profile",result.rows[0]);
	               res.render(pageName,{
	  
	  	           user : req.user ,
				   profile: result.rows[0],
                   message: 'updated',
	  	           selectorDisplay: "show",
	  		       loggedIn: loginStatus,
	               smessage: req.flash('signupMessage'),
		           lmessage: req.flash('loginMessage'),
	  	            path:'profileData',
	 
	  	            footerDisplay: "hide",
	                footerData1: "Blog",
	               footerData2: "FAQs"
  });
			
		}
		
	});
  
});
	app.post('/signup', askForPayment, passport.authenticate('local-signup', {
		successRedirect: '/saveAssetOffline', // redirect to the secure profile section
		failureRedirect: '/tocurrent', // redirect back to the signup page if there is an error
		failureFlash: true // allow flash messages
	}));

	app.post('/adminLogin', passport.authenticate('local-admin', {

		successRedirect: 'admin/index', // redirect to the secure profile section
		failureRedirect: 'admin/login', // redirect back to the signup page if there is an error
		failureFlash: true // allow flash messages
	})
	);

	app.post('/login', passport.authenticate('local-login', {
		successRedirect: '/saveAssetOffline', // redirect to the secure profile section
		failureRedirect: '/tocurrent', // redirect back to the signup page if there is an error
		failureFlash: true // allow flash messages
	}));

    
      app.post('/profile', isLoggedIn, function(req, res) {
		   currentPage = req.session.activePage = "/profile";
	
	loginStatus = checkLoginStatus(req);
 
                    var dob=req.body.calendar;
                    var age=req.body.age;
                    var gender=req.body.gender;
                    var maritalstatus=req.body.maritalstatus;
                    var address=req.body.address;
                    var pincode=req.body.pincode;
                    var city=req.body.city;
                    var pan=req.body.pan;
         // console.log("dob",dob);
                     // name:req.body.username,
                    //email:req.body.email,
                    //mobile:req.body.mnumber,
                    // bank_details:req.body.bankdetails     
				   //email:req.session.userEmail
                    //var created//new date();
                    //var modified=//new date();    ,$10,$11 ,created,modified
           
          // console.log(dob,age,gender,maritalstatus,address,pincode,city,pan);
            console.log("profile Post",req.user.userid);
   var query=client.query("update profile set userid=$1,age=$2,gender=$3,maritalstatus=$4,address=$5,pincode=$6,city=$7,pan=$8,createdby=$9,dob=to_date($10, 'DD-MM-YYYY') where userid=$1", [req.session.user.userid, age, gender, maritalstatus, address, pincode, city, pan, req.session.user.name,dob
],function(err,result){
            if(err)
                console.log("Cant get update profile details from users table",err);
            if(result.rows.length>0)
                {
            		 console.log("Insert to profile details Success..!");
			  }
    
        res.redirect("/profile");
   });
	});


    
    

	app.get('/myStory', isLoggedIn, function (req, res) {
		currentPage = req.session.activePage = "/myStory";
		if (req.session.bseStatus) {
			panMsg = req.session.bseStatus;
		} else {
			panMsg = "";
		}
		mobile = req.useragent["isMobile"];
		if (mobile)
			pageName = "yourStoryMobile";
		else
			pageName = "yourStory";
		loginStatus = checkLoginStatus(req);
		if (loginStatus == true) {
			var query = client.query("SELECT goal.name,count(userinvestmentsheader.goalid) FROM userinvestmentsheader INNER JOIN goal ON userinvestmentsheader.goalid = goal.goalid WHERE userinvestmentsheader.userid=$1 and status in ('pending', 'reconciled') GROUP BY  goal.name ", [req.session.user.userid],
			function (err, result) {
				if (err)
					console.log("Cant get assets values");
				//console.log("details header"+result.rows[0]['count']);
				if (result.rows.length > 0) {
					if (result.rows[0]['count'] > 0) {
						investmentData = result.rows;
						console.log(investmentData[0].count);
					}
				} else {
					investmentData = false;
				}
				res.render(pageName, {
					user: req.user,
					invest: investmentData,
					selectorDisplay: "show",
					loggedIn: loginStatus,
					smessage: req.flash('signupMessage'),
					lmessage: req.flash('loginMessage'),
					path: 'myStoryData',
					footerDisplay: "hide",
					footerData1: "Blog",
					footerData2: "FAQs",
					panMessage: panMsg
				});
			})
		}
		else {
			res.render(pageName, {
				user: req.user,
				invest: "",
				selectorDisplay: "show",
				loggedIn: loginStatus,
				smessage: req.flash('signupMessage'),
				lmessage: req.flash('loginMessage'),
				path: 'myStoryData',
				footerDisplay: "hide",
				footerData1: "Blog",
				footerData2: "FAQs",
				panMessage: panMsg
			});
		}
	});

	app.get('/reports', isLoggedIn, function (req, res) {
		currentPage = req.session.activePage = "/reports";

		mobile = req.useragent["isMobile"];
		if (mobile)
			pageName = "reportsMobile";
		else
			pageName = "yourStory";


		loginStatus = checkLoginStatus(req);
		res.render(pageName, {

			user: req.user,
			selectorDisplay: "show",
			loggedIn: loginStatus,
			path: 'reportsData',
			smessage: req.flash('signupMessage'),
			lmessage: req.flash('loginMessage'),
			footerDisplay: "hide",
			footerData1: "Blog",
			footerData2: "FAQs"
		});
	});

	app.get('/Accounts', isLoggedIn, function (req, res) {
		currentPage = req.session.activePage = "/Accounts";

		loginStatus = checkLoginStatus(req);


		mobile = req.useragent["isMobile"];
		if (mobile)
			pageName = "accountsMobile";
		else
			pageName = "yourStory";

		console.log("invoices", req.session.user.userid);
		var query = client.query("select to_char(a.userinvestmentorderdate,'dd-Mon-yyyy') as investdate, b.name, a.amount,NULLIF(a.units,0) as units from userinvestmentorders a, schemesmaster b where a.schemeid = b.schemeid and a.userid=$1", [req.session.user.userid], function (err, result) {
			if (err)
				console.log("Cant get portfolio details in goal selection" + err);
			console.log("ja be loude" + result.rows.length)

			if (result.rows.length > 0) {
				console.log("statements");


				var len = result.rows.length;


				res.render(pageName, {

					user: req.user,
					stmt: result.rows,
					length: len,
					selectorDisplay: "show",
					loggedIn: loginStatus,
					path: 'accountData',
					smessage: req.flash('signupMessage'),
					lmessage: req.flash('loginMessage'),
					path1: 'accountInvoicesData',
					footerDisplay: "hide",
					footerData1: "Blog",
					footerData2: "FAQs"
				});
			} else {

				res.render(pageName, {

					user: req.user,
					stmt: false,
					selectorDisplay: "show",
					loggedIn: loginStatus,
					path: 'accountData',
					smessage: req.flash('signupMessage'),
					lmessage: req.flash('loginMessage'),
					path1: 'accountInvoicesData',
					footerDisplay: "hide",
					footerData1: "Blog",
					footerData2: "FAQs"
				});


			}
		});
	});

	app.get('/Invoices', isLoggedIn, function (req, res) {
		currentPage = req.session.activePage = "/Invoices";
		loginStatus = checkLoginStatus(req);
		var today = new Date();
		var date = today.getDate()+'-'+(today.getMonth()+1)+'-'+today.getFullYear();
		mobile = req.useragent["isMobile"];
		if (mobile)
			pageName = "myInvoicesMobile";
		else
			pageName = "yourStory";
		console.log("invoices", req.session.user.userid);
		var query = client.query("select to_char(a.userinvestmentorderdate,'dd-Mon-yyyy') as investdate, b.name, a.amount,NULLIF(a.units,0) as units from userinvestmentorders a, schemesmaster b where a.schemeid = b.schemeid and a.amount > 0 and a.userid=$1 order by 1 desc", [req.session.user.userid], function (err, result) {
			if (err)
				console.log("Cant get portfolio details in goal selection");
			if (result.rows.length > 0) {
				console.log("statements");
				var len = result.rows.length;
				res.render(pageName, {
					user: req.user,
					stmt: result.rows,
					length: len,
					selectorDisplay: "show",
					loggedIn: loginStatus,
					path: 'accountData',
					smessage: req.flash('signupMessage'),
					lmessage: req.flash('loginMessage'),
					path1: 'accountInvoicesData',
					footerDisplay: "hide",
					footerData1: "Blog",
					footerData2: "FAQs",
					date: date,
					currentPage: currentPage
				});
			}
		});
	});

	app.get('/Settings', isLoggedIn, function (req, res) {

		currentPage = req.session.activePage = "/Settings";

		mobile = req.useragent["isMobile"];
		if (mobile)
			pageName = "settingsMobile";
		else
			pageName = "yourStory";


		loginStatus = checkLoginStatus(req);
		res.render(pageName, {

			user: req.user,
			selectorDisplay: "show",
			loggedIn: loginStatus,
			path: 'accountData',
			smessage: req.flash('signupMessage'),
			lmessage: req.flash('loginMessage'),
			path1: 'accountSettingsData',
			footerDisplay: "hide",
			footerData1: "Blog",
			footerData2: "FAQs",
			currentPage: currentPage
		});
	});

	app.get('/Transaction', isLoggedIn, function (req, res) {

		currentPage = req.session.activePage = "/transaction";

		loginStatus = checkLoginStatus(req);
		mobile = req.useragent["isMobile"]
		if (mobile) {
			res.render('transactionMobile.ejs', {

			});
		} else {
			res.render('yourStory.ejs', {

				user: req.user,
				selectorDisplay: "show",
				loggedIn: loginStatus,
				path: 'accountData',
				smessage: req.flash('signupMessage'),
				lmessage: req.flash('loginMessage'),
				path1: 'accountTransactionData',
				footerDisplay: "hide",
				footerData1: "Blog",
				footerData2: "FAQs",
				currentPage: currentPage
			});
		}
	});

	app.get('/Investment', isLoggedIn, function (req, res) {
		currentPage = req.session.activePage = "/Investment";
		loginStatus = checkLoginStatus(req);
		var today = new Date();
		var date = today.getDate()+'-'+(today.getMonth()+1)+'-'+today.getFullYear();
		mobile = req.useragent["isMobile"];
		if (mobile)
			pageName = "myInvoicesMobile";
		else
			pageName = "yourStory";
		console.log("invoices", req.session.user.userid);
		var query = client.query("SELECT a.usersubscriptionorderid, to_char(orderdate, 'dd-Mon-yyyy') AS orderdate, amount, paymentreference, durationdays, to_char(planrenewaldate, 'dd-Mon-yyyy') AS planrenewaldate  FROM usersubscriptionsorder a, usersubscriptions b WHERE a.userid = b.userid AND a.usersubscriptionorderid = b.usersubscriptionorderid AND a.status = 'success' AND a.userid = $1 ORDER BY 3 DESC", [req.session.user.userid], function (err, result) {
			if (err) {
				console.log("Cant get portfolio details in goal selection");
			} else if (result.rows.length > 0) {
				console.log("statements");
				var len = result.rows.length;
				res.render(pageName, {
					user: req.user,
					stmt: result.rows,
					length: len,
					selectorDisplay: "show",
					loggedIn: loginStatus,
					path: 'accountData',
					smessage: req.flash('signupMessage'),
					lmessage: req.flash('loginMessage'),
					path1: 'accountInvestmentData',
					footerDisplay: "hide",
					footerData1: "Blog",
					footerData2: "FAQs",
					date: date,
					currentPage: currentPage
				});
			}
		});
	});

	app.get('/Privacy', function (req, res) {
		currentPage = req.session.activePage = "/Privacy";

		mobile = req.useragent["isMobile"]
		if (mobile) {
			res.render('privacyMobile.ejs', {
				selectorDisplay: "show",
				smessage: req.flash('signupMessage'),
				lmessage: req.flash('loginMessage'),
				loggedIn: loginStatus,
				user: req.user,
				footerDisplay: "show",
				footerData1: "Blog",
				footerData2: "FAQs"

			});
		}
		else {
			res.render('privacy.ejs', {
				selectorDisplay: "show",
				smessage: req.flash('signupMessage'),
				lmessage: req.flash('loginMessage'),
				loggedIn: loginStatus,
				user: req.user,
				footerDisplay: "show",
				footerData1: "Blog",
				footerData2: "FAQs"


			});
		}


	});

	app.get('/Policies', function (req, res) {
		currentPage = req.session.activePage = "/Policies";
		mobile = req.useragent["isMobile"]
		if (mobile) {
			res.render('policyMobile.ejs', {
				selectorDisplay: "show",
				smessage: req.flash('signupMessage'),
				lmessage: req.flash('loginMessage'),
				loggedIn: loginStatus,
				user: req.user,
				footerDisplay: "show",
				footerData1: "Blog",
				footerData2: "FAQs"

			});
		}
		else {

			res.render('policies.ejs', {
				selectorDisplay: "show",
				smessage: req.flash('signupMessage'),
				lmessage: req.flash('loginMessage'),
				loggedIn: loginStatus,
				user: req.user,
				footerDisplay: "show",
				footerData1: "Blog",
				footerData2: "FAQs"


			});
		}

	})

	app.get('/tocurrent', function (req, res) {

		console.log(req.session.activePage);
		res.redirect(req.session.activePage);



	});

	//Permissions fo facebook


	// Redirect the user to Facebook for authentication.  When complete,
	// Facebook will redirect the user back to the application at
	//     /auth/facebook/callback
	app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

	// Facebook will redirect the user to this URL after approval.  Finish the
	// authentication process by attempting to obtain an access token.  If
	// access was granted, the user will be logged in.  Otherwise,
	// authentication has failed.
	app.get('/auth/facebook/callback',
		passport.authenticate('facebook', {
			successRedirect: '/tocurrent',
			failureRedirect: '/',
			scope: ['email']
		}), function (req, res, next) {



		}
	);

	app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

	app.get('/auth/google/callback',
		passport.authenticate('google', {
			successRedirect: '/tocurrent',
			failureRedirect: '/'
		}));




	app.get('/forgot', function (req, res) {
		res.render('forgot', {
			user: req.user
		});
	});


	//forgot password module handler

	app.post('/forgot', function (req, res, next) {
		async.waterfall([
			function (done) {
				crypto.randomBytes(20, function (err, buf) {
					var token = buf.toString('hex');
					done(err, token);
				});
			},
			function (token, done) {
				User.findOne({ 'user.local.email': req.body.email }, function (err, user) {
					if (!user) {
						req.flash('error', 'No account with that email address exists.');
						return res.redirect('/forgot');
					}
					//console.log(user.local.email);
					var newUser = new User();

					newUser.resetPasswordToken = token;
					newUser.resetPasswordExpires = Date.now() + 3600000; // 1 hour

					newUser.save(function (err) {
						done(err, token, newUser);
					});
				});
			},
			function (token, user, done) {

				var nodemailer = require('nodemailer');

				var smtpConfig = {
					host: 'smtp.gmail.com',
					port: 465,
					secure: true,
					auth: {
						user: 'nishant143n@gmail.com',
						pass: 'nishant0092'
					}
				};

				var transporter = nodemailer.createTransport(smtpConfig);


				var mailOptions = {
					from: 'nishant143n@gmail.com',
					to: user.local.email,
					subject: 'Node.js Password Reset',
					html: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
					'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
					'http://' + req.headers.host + '/reset/:' + token + '\n\n' +
					'If you did not request this, please ignore this email and your password will remain unchanged.\n'
				};

				transporter.sendMail(mailOptions, function (error, info) {
					if (error) {
						return console.log(error);
					}
					console.log('Message sent: ' + info.response);
				});


			}
		], function (err) {
			if (err) return next(err);


			else res.redirect('/');

		});
	});



	app.get('/reset/:token', function (req, res) {
		User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
			if (!user) {
				req.flash('error', 'Password reset token is invalid or has expired.');
				return res.redirect('/');
			}
			res.render('reset', {
				user: req.user
			});
		});
	});


	app.post('/reset/:token', function (req, res, done) {
		async.waterfall([
			function (done) {

				// console.log("Hi");
				User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
					if (!user) {
						req.flash('error', 'Password reset token is invalid or has expired.');
						return res.redirect('/back');
					}
					var newUser = new User();
					newUser.local.password = req.body.password;
					newUser.local.resetPasswordToken = undefined;
					newUser.local.resetPasswordExpires = undefined;

					user.save(function (err) {
						req.logIn(user, function (err) {
							done(err, user);
						});
					});
				});
			},
			function (user, done) {

				var mailOptions = {

					from: 'nishant143n@gmail.com',
					to: newUser.local.email,
					subject: 'Your password has been changed',
					html: 'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
				};

				transporter.sendMail(mailOptions, function (error, info) {
					if (error) {
						return console.log(error);
					}
					console.log('Message sent: ' + info.response);
				});


			}

		], function (err) {
			res.redirect('/');
		});
		console.log("end of token route");
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function (req, res) {
		req.session.destroy();
		req.logout();
		res.redirect('/');
	});
};





function askForPayment(req, res, next) {

	if (req.body.askScheme || req.session.ForPayment)
		req.session.ForPayment = true;
	else
		req.session.ForPayment = false;

	return next();
}

// route middleware to make sure
function isLoggedIn(req, res, next) {

	var a = req.isAuthenticated();

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated()) {
		req.session.loggedIn = true;

		//console.log(req.session.user.userid);
		req.session.user = req.user;
		console.log(req.session.user);
		return next();
	}
	req.session.user = "";
	req.session.loggedIn = false;
	// if they aren't redirect them to the home page
	return next();
}

function FeatureCollection() {
	this.type = 'FeatureCollection';
	this.features = new Array();
}