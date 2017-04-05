
var totalYears;
var sip;
function getSIP(){
	
	alert("dad");
	totalYears = document.getElementById("years").value;
	sip=document.getElementById("sip").value; 
	
	
	 localStorage.sip = sip;
	 localStorage.years = totalYears;
	 localStorage.sipInvestment = true;	
	console.log("years"+totalYears+"time"+sip);
	
	window.location.href = "/GoalSelection";
	
}


function showSIP(){
	
	$(" .moodGoals > img").css("visibility","hidden");
	  $(".contentMood .page1, .contentMood .page2,.contentMood .page3, .page3Sub,.contentMood .page4 .sub-page4").hide();
	$(".page2 .dotHr").hide();
	  $(".contentMood .page4,.contentMood .page4 .selectMode").show();
/*	console.log("years"+localStorage.years+"time"+	 localStorage.sip);*/
}
	
