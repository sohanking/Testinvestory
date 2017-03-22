

$(document).ready(function(){


    

  resizeContent();

    $(window).resize(function() {
        resizeContent();
    });


var acc = document.getElementsByClassName("accordion");
var i;

for (i = 0; i < acc.length; i++) {
    acc[i].onclick = function(){
        this.classList.toggle("active");
        this.nextElementSibling.classList.toggle("show");
  }
}    
  
    $(".goalReportData").hover(function(){
        
        $(".goalReportData #invest_withdraw").hide();
        $("#invest_withdraw",this).show();
        
    });
    
  /*
	$("#pay").click(function(){
		
		window.location.href = "Pricing";
	});*/
	
$(".logo a.tooltips span").click(function(){
	
	
	 window.location.href = "KnowUs";
});	

	$(".logo a.tooltips img").click(function(){
	
	
	 window.location.href = "/";
});	
	
	
$(".abc a").click(function(){

  var aid = $(this).attr("href");
    if(aid == "#settings"){
 $("#ii").css("left","-9%");
    }else{
        
         $("#ii").css("left","42%");
    }
   

    
});    
    

		$("#angle").click(function(){
		
	
		 $(".main").moveDown();
		
	});
	
    
//$(".wxt .storyBtn").click(function()
//{
//    
//    $(".wxt .storyBtn").removeClass("act");
//    $(this).addClass("act");
//    
//});
//  
//    
//$("#account .storyBtn").click(function()
//{
//    
//    $("#account .storyBtn").removeClass("act");
//    $(this).addClass("act");
//    
//});
//        
    
	
	

$(".FAQs").click(function (){
    
     window.location.href = "FAQs";
});


   
/*$("#login").click(function (){
    
     window.location.href = "YourStory";
 
});*/
       
    
$(".pricing").click(function (){
    
     window.location.href = "Pricing";
});
    
$(".getStarted").click(function (){
    
     window.location.href = "GoalSelection";
});
        
    
     
$(".yourMood").css("display","block");
$(".frogImage").css("display","none");      
  
    
$(function(){
  $('.slider .left').click(function(){
     
   var leftScroll = Math.abs(parseInt($('.photosInner').css('left')));
      
      
      
      if(leftScroll <= 0){
          $(".photosInner").animate({'left':'0'}, 'fast');
}else{
    
    $(".photosInner").animate({'left':'+=80'}, 'slow');
}
    
      
  

  });
    
      $('.slider .right').click(function(){
     

        
   var leftScroll = Math.abs(parseInt($('.photosInner').css('left')));
      
        
      
      if(leftScroll < 170){
           $(".photosInner").animate({'left':'-=80'}, 'slow');
}else{
    
    $(".photosInner").animate({'left':'0'}, 'fast');
}
  
 
          
  });
    
});    
    
	var pr;
     $(".selectMode a.tooltips button").hover(function(){
     
		pr = $(this).attr("profile");
     
    $(".selectMode a.tooltips span#"+pr).addClass("logoTip");
     
      $(".selectMode a.tooltips span#"+pr).show();
   
     
 }, function(){
         
         
         
           $(".selectMode a.tooltips span#"+pr).hide();                      
                                 
     });
    
	
	
    /*Login Read More*/
    
     $(".logo-icon,.logo").hover(function(){
     

     
    $(".logo a.tooltips span").addClass("logoTip");
     
      $(".logo a.tooltips span").show();
   
     
 }, function(){
         
         
         
           /*$(".logo a.tooltips span").hide();  */                    
                                 
                                 });
    
    $(document).click(function() {
        
        $(".logo a.tooltips span").hide(); 
         $(".goalReportData #invest_withdraw").hide(); 
    });
    var socialname,socianameHover;
	
	$(".socialIcons a > img").hover(function(){
		
		imgName = $(this).attr("id");
	
		switch(imgName){
				
			case 'fb': socianameHover = "fbHover";
				socialname= "fb";
				break;
				case 'twitter': socianameHover = "twitterHover";
				socialname= "twitter";
				break;
				case 'linkdin': socianameHover = "linkdinHover";
				socialname= "linkdin";
				break;
				case 'gp': socianameHover = "gpHover";
				socialname= "gp";
				break;
		}
		
		$(this).attr("src","images/social/"+socianameHover+".png");
		
	}, function(){
		
		$(this).attr("src","images/social/"+socialname+".png");
	});
	
/*Better Plan*/

 $(".how-it-works #Bp li").hover(function(){
     
  tipId  = $(this).attr("id");
     var tipData;
     
   
     switch(tipId){
             
        case 'bp1': return;
             break;
        
        case 'bp2': tipData ="personalized call every month";   
             break;
             
        case 'bp3': tipData ="online meeting twice a year";
             break;
             
     }
     
    $(".how-it-works a.tooltips #BpData").addClass("tipTop");
     
      $(".how-it-works a.tooltips #BpData").show();
    $(".how-it-works a.tooltips #BpData").html(tipData);
     
 }, function(){
           $(".how-it-works a.tooltips #BpData").hide();                      
                                 
                                 });
    
    
    /*Best Plan*/
    
     $(".how-it-works #Bstp li").hover(function(){
     
  tipId  = $(this).attr("id");
     var tipData;
     
   
     switch(tipId){
             
        case 'Bstp1': return;
             break;
        
        case 'Bstp2': tipData ="helps track your every transaction and status";   
             break;
             
        case 'Bstp3': tipData ="tells you how much investment you have in each industry";
             break;
             
              case 'Bstp4': tipData ="monitors your balance of debt and equity";
             break;
        
        case 'Bstp5': tipData ="tells you how much investment you have in each fund";   
             break;
             
        case 'Bstp6': tipData ="market analytics and insights from our team of experts";
             break;
                case 'Bstp7': tipData ="new and old product research to stay up to date";   
             break;
             
        case 'Bstp8': tipData ="Quick reports on world events like Brexit, Union budget, Elections etc";
             break;
             
     }
     
    $(".how-it-works a.tooltips #BstpData").addClass("tipTop");
     
      $(".how-it-works a.tooltips #BstpData").show();
    $(".how-it-works a.tooltips #BstpData").html(tipData);
     
 }, function(){
           $(".how-it-works a.tooltips #BstpData").hide();                      
                                 
                                 });
    
        
    /*Good Plan*/
    
     $(".how-it-works #Gp li").hover(function(){
     
  tipId  = $(this).attr("id");
     var tipData;
     
   
     switch(tipId){
             
        case 'Gp1': tipData ="helps track your target goals and achievement";
             break;
        
        case 'Gp2': tipData ="tells you where your money stands";   
             break;
             
        case 'Gp3': tipData ="tells you if you have to pay tax on gains";
             break;
             
              case 'Gp4': tipData ="our take on market news";
             break;
        
             
     }
     
    $(".how-it-works a.tooltips #GpData").addClass("tipTop");
     
      $(".how-it-works a.tooltips #GpData").show();
    $(".how-it-works a.tooltips #GpData").html(tipData);
     
 }, function(){
           $(".how-it-works a.tooltips #GpData").hide();                      
                                 
                                 });
    
    
    
var $imgLink = "images/";
var $imgExtension = ".png";
var $onHover = "Hover";
var $Feeling = "Feeling";
var $moodImageDisplay = true;
 var moodId;  
var frogMood="";
var $loggedIn;
    
var moodFile;
    

//Goals
var $GoalimgLink = "images/goals/"; 
    
var Rich = ["Crorepati", "Fancy Car", "Double the money"];

var Broke = ["Emergency", "Medical Corpus", "Splurging"];
    
var Responsible = ["Childs Education", "Retirement", "Home"];

var Nerdy = ["Education", "Gadget", "Build a book collection"];
    
var Social = ["Holiday", "World Cup", "Concert", "Course"];
    //, "Fitness"
    
var Loved = ["Marriage", "Honeymoon", "Anniversary Gifts"];

    
    

    

	function moodColorChange(moods){
		
		    var cirColor;

    
     switch(moods){
                
            case "Broke": 
                
                 cirColor = "#fc7a54";
                break;
                
             case "Nerdy": 
               
                cirColor = "#5a96d8";
                break;
                
             case "Rich": 
              
               cirColor = "#71b5ec";
                break;
                
             case "Responsible": 
               
                 cirColor = "#bc4b62";
                break;
                
            case "Loved": 
               
                cirColor = "#764a84";
                break;
                
            case "Social": 
               
                 cirColor = "#3a785e";
                break;
                
        }
    
		return cirColor;
	}
	
//Home Page Moods Selection    
$(".feelingCircularMenu ul li").mouseenter(function(){
  
     moodId = $(this).attr("id");
    
    var moodImgName = moodId;
    
circleColor = 	moodColorChange(moodId);

   $.ColorFill(circleColor);  


    
    if($moodImageDisplay){
          $moodImageDisplay = false;
        $(".yourMood").css("display","none");
        $(".frogImage").css("display","block");
        
    }
    
          $(".feelingCircularMenu ul li").css("border-bottom","2px solid rgba(53, 191, 211, 0)");
             $(".feelingCircularMenu ul li a").css("color","#333");
    
      $(this).css("border-bottom","2px solid #35BFD3");
             $("a", this).css("color","#35BFD3");
    
   
    $(".frogImage img").attr("src", $imgLink+moodImgName+$imgExtension);
    
    $(".frogImage h1").html($Feeling+" "+moodId);
    
});    
    
    
    $(".feelingCircularMenu ul li").click(function(){
  

    
    moodId = $(this).attr("id");
    
    var moodImgName = moodId;
    
    $(".frogImage img").attr("src", $imgLink+moodImgName+$imgExtension);
    
    $(".frogImage h1").html($Feeling+" "+moodId);
    
});    
   
    
$(".moods .pagination li:nth-child(1) a").css({"background-color":"#FFDE15","color":"#35BFD3","border-color":"#FFDE15"});
//
//    $(".frogImageMoods img").attr("src", $imgLink+frogMood+$imgExtension);

    $(".frogImage img, .frogImage h1, .feelingCircularMenu ul li").click(function(){
        
        frogMood=moodId;
         window.location.href = "GoalSelection?mood="+frogMood;
            
    $(".moods .pagination li:nth-child(1) a").css({"background-color":"#FFDE15","color":"#35BFD3","border-color":"#FFDE15"});
        //setFrogMood(frogMood);
    });
    
    
    function getGoals(moods){

		  var local=[]; 
		
        switch(moods){
                
            case "Broke": 
                
                local=Broke.slice(0);
                break;
                
             case "Nerdy": 
               
                local=Nerdy.slice(0);
                break;
                
             case "Rich": 
               
                local=Rich.slice(0);
                break;
                
             case "Responsible": 
               
                 local=Responsible.slice(0);
                break;
                
            case "Loved": 
               
                local=Loved.slice(0);
                break;
                
            case "Social": 
               
                local=Social.slice(0);
                break;
                
        }
     
		return local;

	
	}
   

    
    $(".selectGoal ul li > a").click(function(){
        
       
            moodId = $(this).attr("id");
	
      var   goalId = $(this).attr("goal");
 	 window.location.href = "/GoalSelection?mood="+moodId+"&goal="+goalId;
		
    var moodImgName = moodId;
    
    $(".frogImageMoods img").attr("src", $imgLink+moodImgName+$imgExtension);
    
    $(".frogImageMoods h1").html($Feeling+" "+moodId);
        
         
        
       
    
          var local;
		local = getGoals(moodId);
		
         $(".below").empty();
        
        for(i=local.length-1; i>= 0; i--){
            if(i==goalId){
           
                $(".below").prepend("<div class='goal' id='activ'><img src='"+$GoalimgLink+moodId+"/"+local[i]+$onHover+$imgExtension+"' mood="+moodId+" alt='Home view'><p id='mood'><span style='background-color: #FFDE15'></span>"+local[i]+"</p></div>");
                
               moodFile =  local[i]; 
               
            }else{
                
    $(".below").prepend("<div class='goal' id=''><img src='"+$GoalimgLink+moodId+"/"+local[i]+$imgExtension+"' mood="+moodId+" alt='Home view'><p id='mood'><span></span>"+local[i]+"</p></div>");
}
            
        }
        
        
        
    });
   
      
    $(".selectMood ul li > a").click(function(){
        
     
            moodId = $(this).attr("id");
   window.location.href = "/GoalSelection?mood="+moodId;
    var moodImgName = moodId;
    
    $(".frogImageMoods img").attr("src", $imgLink+moodImgName+$imgExtension);
    
    $(".frogImageMoods h1").html($Feeling+" "+moodId);
        
        
        
          var local;
		local = getGoals(moodId);
		
         $(".below").empty();
        
        for(i=local.length-1; i>= 0; i--){
            
    $(".below").prepend("<div class='goal' id=''><img src='"+$GoalimgLink+moodId+"/"+local[i]+$imgExtension+"' mood="+moodId+" alt='Home view'><p id='mood'><span></span>"+local[i]+"</p></div>");
        }
        
        
    });
    

        // Parse the URL
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var source = getParameterByName('mood');
var sourceGoal = getParameterByName('goal');

	

	
	/*if(source && sourceGoal){
		
		          var local;
		local = getGoals(source);
		
         $(".below").empty();
        
        for(i=local.length-1; i>= 0; i--){
            if(i==sourceGoal){
           	alert(i);
                $(".below").prepend("<div class='goal' id='activ'><img src='"+$GoalimgLink+source+"/"+local[i]+$onHover+$imgExtension+"' mood="+source+" alt='Home view'><p id='mood'><span style='background-color: #FFDE15'></span>"+local[i]+"</p></div>");
                
             
                
            }else{
                
    $(".below").prepend("<div class='goal' id=''><img src='"+$GoalimgLink+source+"/"+local[i]+$imgExtension+"' mood="+source+" alt='Home view'><p id='mood'><span></span>"+local[i]+"</p></div>");
}
            
        }
	}
   */
	
	var moodsss="";
        if(source){
          
             $("#setMood").attr("src", $imgLink+source+$imgExtension);
          $("#setMoodText").html($Feeling+" "+source);
	moodsss=source;
            
      
          var local;
		local = getGoals(source);
        
         $(".below").empty();
        
        for(i=local.length-1; i>= 0; i--){
            
			
			if(sourceGoal && i==sourceGoal){
           	
                $(".below").prepend("<div class='goal' id='activ'><img src='"+$GoalimgLink+source+"/"+local[i]+$onHover+$imgExtension+"' mood="+source+" alt='Home view'><p id='mood'><span style='background-color: #FFDE15'></span>"+local[i]+"</p></div>");
                
             
                
            }else{
                
  
               $(".below").prepend("<div class='goal' id=''><img src='"+$GoalimgLink+source+"/"+local[i]+$imgExtension+"' mood="+source+" alt='Home view'><p id='mood'><span></span>"+local[i]+"</p></div>");
}
			
        }
        
            
        }else{
            
            $("#setMood").attr("src", $imgLink+"Rich"+$imgExtension);
          $("#setMoodText").html($Feeling+" "+"Rich"); 
			 moodsss="Rich";
			
        }
        

    
function setFrogMood(mood){
    
    var frogMoodImgName = mood.toUpperCase();
    $("#setMood").attr("src", $imgLink+frogMoodImgName+$imgExtension);
          $("#setMoodText").html($Feeling+" "+frogMoodImgName);
	moodsss=frogMoodImgName;
}
    
//Moods 
  
    $(".moods .slider .change").click(function(){

    
    var moodId = $(this).attr("id");
    
		 window.location.href = "/GoalSelection?mood="+moodId;
		
    var moodImgName = moodId.toUpperCase();
    
      
          var local;
		local = getGoals(moodId);
		
    $(".frogImageMoods img").attr("src", $imgLink+moodImgName+$imgExtension);
    
    $(".frogImageMoods h1").html($Feeling+" "+moodId);
        
         $(".below").empty();
 
              for(i=0; i < local.length; i++){
            
               $(".below").append("<div class='goal' id=''><img src='"+$GoalimgLink+moodId+"/"+local[i]+$imgExtension+"' mood="+moodId+" alt='Home view'><p id='mood'><span></span>"+local[i]+"</p></div>");
        }
        
    
});    
  
    
    
//What We offer    
    
var $emergencyFunds = "emergencyFunds"; 
var $taxSavings = "taxSavings";
var $buildWealth = "buildWealth";
var $smartGoals = "smartGoals";
    
     var smartSource = getParameterByName('smartGoal');
    var smartMood = getParameterByName('smood');
        if(smartSource){
              
             $("#setMood").attr("src", $imgLink+smartSource+"Mood"+$imgExtension);
			moodsss= smartSource+"Mood";
         $("#setMoodText").html(" ");
			
            $(".moods .slider").hide();
            
             var local; 
    
        switch(smartSource){
                
            case "emergencyFunds": 
               
                local="Emergency";
                break;
                
             case "taxSavings": 
               
                local="Tax Saving";
                break;
                
             case "buildWealth": 
               
                local="Crorepati";
                break;
                
             case "smartGoals": 
               
                local="Retirement";
                break;
                
                
        }
        

        
         $(".below").empty();
        
       
               $(".below").prepend("<div class='goal' id=''><img src='"+$GoalimgLink+smartMood+"/"+local+$imgExtension+"' mood="+smartMood+" alt='Home view'><p id='mood'><span></span>"+local+"</p></div>");
        
        
            
        }
    

    $(".emergency-funds > p").click(function(){
        
        var sipMood = $(this).attr("id");
             window.location.href = "GoalSelection?smartGoal="+$emergencyFunds+"&smood="+sipMood;
        
    });
    
    
        $(".tax-savings > p").click(function(){
        
        var sipMood = $(this).attr("id");
             window.location.href = "GoalSelection?smartGoal="+$taxSavings+"&smood="+sipMood;
        
    });
    
        
        $(".build-wealth > p").click(function(){
        
        var sipMood = $(this).attr("id");
             window.location.href = "GoalSelection?smartGoal="+$buildWealth+"&smood="+sipMood;
        
    });
    
    
            $(".smart-goals > p").click(function(){
        
        var sipMood = $(this).attr("id");
             window.location.href = "GoalSelection?smartGoal="+$smartGoals+"&smood="+sipMood;
        
    });
    
    $(".emergency-funds > img")
        .on
    ({
        
        mouseenter: function() 
        {
            $(this).attr("src", $imgLink+$emergencyFunds+$onHover+$imgExtension);
        }, 
        
        mouseleave: function()
        {
            $(this).attr("src", $imgLink+$emergencyFunds+$imgExtension);
        }, 
        
        click: function()
        {
             var sipMood = $(this).attr("id");
             window.location.href = "GoalSelection?smartGoal="+$emergencyFunds+"&smood="+sipMood;
         
        }
          
          
    });
    
    $(".tax-savings > img")
        .on
    ({
        
        mouseenter: function() 
        {
            $(this).attr("src", $imgLink+$taxSavings+$onHover+$imgExtension);
        },         
        mouseleave: function()
        {
            $(this).attr("src", $imgLink+$taxSavings+$imgExtension);
        }, 
        
        click: function()
        {
             var sipMood = $(this).attr("id");
             window.location.href = "GoalSelection?smartGoal="+$taxSavings+"&smood="+sipMood;
         
        }
          
    });
    
        
    $(".build-wealth > img")
        .on
    ({
        
        mouseenter: function() 
        {
            $(this).attr("src", $imgLink+$buildWealth+$onHover+$imgExtension);
        },         
        mouseleave: function()
        {
            $(this).attr("src", $imgLink+$buildWealth+$imgExtension);
        }, 
        
        click: function()
        {
             var sipMood = $(this).attr("id");
             window.location.href = "GoalSelection?smartGoal="+$buildWealth+"&smood="+sipMood;
         
        }
          
    });
    
    $(".smart-goals > img")
        .on
    ({
        
        mouseenter: function() 
        {
            $(this).attr("src", $imgLink+$smartGoals+$onHover+$imgExtension);
        },         
        mouseleave: function()
        {
            $(this).attr("src", $imgLink+$smartGoals+$imgExtension);
        }, 
        
        click: function()
        {
             var sipMood = $(this).attr("id");
             window.location.href = "GoalSelection?smartGoal="+$smartGoals+"&smood="+sipMood;
         
        }
          
    });

    
   $(".how-it-works .panel").click(function(){ 
   
        
        $(".panel-heading").css("background-color","#35BFD3");
        $(".panel-heading h2").css("color","#F2F5FB");
       $(".panel-heading .pDot").css("border","2px #F2F5FB solid");
       $(".panel-body ul, .panel-body h2").css("color","#333333");
       
       
         $(".panel-body ul, .panel-body h2",this).css("color","#35BFD3");
        $(".panel-heading",this).css("background-color","#FFDE15");
       $(".panel-heading h2",this).css("color","#35BFD3");
       $(".panel-heading .pDot",this).css("border","2px #35BFD3 solid");
     
   });
    
       $(".how-it-works .panel").mouseenter(function(){ 
   
        
        $(".panel-heading").css("background-color","#35BFD3");
        $(".panel-heading h2").css("color","#F2F5FB");
       $(".panel-heading .pDot").css("border","2px #F2F5FB solid");
       $(".panel-body ul, .panel-body h2").css("color","#333333");
       
       
         $(".panel-body ul, .panel-body h2",this).css("color","#35BFD3");
        $(".panel-heading",this).css("background-color","#FFDE15");
       $(".panel-heading h2",this).css("color","#35BFD3");
       $(".panel-heading .pDot",this).css("border","2px #35BFD3 solid");
     
   });
    
    String.prototype.filename=function(extension){
    var s= this.replace(/\\/g, '/');
    s= s.substring(s.lastIndexOf('/')+ 1);
    return extension? s.replace(/[?#].+$/, ''): s.split('.')[0];
}
    

     $(document).on("click", '.below .goal',function(){
        
         $(this).attr("id","activ");
          $("#mood span").css("background-color","#F2F5FB");
        
        $("#mood span",this).css("background-color","#FFDE15");
         moodFile =  $("#mood",this).text(); 
         
        

     });
    
    var currentMood;
    
     $(document).on("mouseenter", '.below .goal',function(){
        
//          $("#mood span").css("background-color","#F2F5FB");
//        
//        $("#mood span",this).css("background-color","#FFDE15");
         
         var clickActive = $(this).attr("id");
         
         
         
         if(clickActive == "activ"){
             
}else{

         var goalImg = $("#mood",this).text(); 
      currentMood = $("img", this).attr("mood");
        var currentImg =  $("img", this).attr("src");
            
        $("img", this).attr("src",   $GoalimgLink+currentMood+"/"+goalImg+$onHover+$imgExtension);     
}
        
     });
    
    var currentPage=1;
var movingTo= 0;

         $(document).on("mouseleave", '.below .goal',function(){
        
//              $("#mood span",this).css("background-color","#F2F5FB");
        
      var clickActive = $(this).attr("id");
         
         if(clickActive == "activ"){
}else{

         var goalImg = $("#mood",this).text(); 
     currentMood = $("img", this).attr("mood");
        var currentImg =  $("img", this).attr("src");
          
        $("img", this).attr("src",   $GoalimgLink+currentMood+"/"+goalImg+$imgExtension);
}

        
          
     });
    


 $(".contentMood .page2, #Indicator,#rpText, #riskSelected, #yp, .contentMood .page3, .page3Sub, .contentMood .page4, .contentMood .page5").hide();
    

    
    $(".page1 .next, .page1 .skip").click(function(){ 

        $(".contentMood .page1, #btm").hide();
        currentPage=2;
      
         $(".moods .pagination li:nth-child(1) a").css({"background-color":"#F2F5FB","color":"#FFDE15","border-color":"#FFDE15"});
        
        $(".pagination li:nth-child(2) a").css({"background-color":"#FFDE15","color":"#35BFD3","border-color":"#FFDE15"});
        
         $("#goalSelected").text(moodFile);
		//document.getElementById("setGoal").value = moodFile;
		//document.getElementById("getMoodG").value = moodsss;
        
        //$(".page2 > h2").text(moodFile);
        
        $(".contentMood .page2, #Indicator").show();
        
        $(".contentMood .page2 .login-btn").css("top","65%"); 
 });
 

var once = true;
    
    $(".page2 .go").click(function(){ 
    
         currentPage=3;
        $(".contentMood .page2 .login-btn").css("top","15%"); 
        
        if(once){
             
        
         $(".contentMood .page3, .page3Sub, #rpText").show();
        
   $(".pagination li:nth-child(2) a").css({"background-color":"#F2F5FB","color":"#FFDE15","border-color":"#FFDE15"});
        
        $(".pagination li:nth-child(3) a").css({"background-color":"#FFDE15","color":"#35BFD3","border-color":"#FFDE15"});
        
//         $(".contentMood .go").css({"background-color":"#F2F5FB","color":"#35BFD3","border-color":"#35BFD3"});
//        
              $(".page2 .dotHr").hide();
            
         $(".contentMood .page3> p").css("color","#35BFD3");
        
            once = false;
        }
        
        
     });
    
    
      $(".page2 .next").click(function(){ 
    
         currentPage=4;
        
         $(".contentMood .page2,.contentMood .page3, .page3Sub,.contentMood .page4 .sub-page4").hide();
    
          
             $(".pagination li:nth-child(3) a").css({"background-color":"#F2F5FB","color":"#FFDE15","border-color":"#FFDE15"});
        
        $(".pagination li:nth-child(4) a").css({"background-color":"#FFDE15","color":"#35BFD3","border-color":"#FFDE15"});
          
           $(".contentMood .page4 #invest").css("color","#35BFD3");
          
              $(".contentMood .page4").show();
          
          
               });
    
var page4Risk;
    $(".page4 .selectMode button").click(function(){ 
        
           
        
        var risk = $(this).attr("id");
       page4Risk = risk;
       
        
        if(risk == "dontKnow" ){
             currentPage=4;
            $(".contentMood .page4 .selectMode").hide();
            
            $(".contentMood .page4 .sub-page4").show();
            
}else{
	currentPage=5;
	 $("#riskSelected").text(rp);
  
    
     $(".contentMood .page4").hide();
        
        $(".pagination li:nth-child(4) a").css({"background-color":"#F2F5FB","color":"#FFDE15","border-color":"#FFDE15"});
        
        $(".pagination li:nth-child(5) a").css({"background-color":"#FFDE15","color":"#35BFD3","border-color":"#FFDE15"});
          
           
     $(".contentMood .page5, #yp, #riskSelected").show();
          
        
}
 
        
      });
    
    
    $(".page4 .sub-page4 .done").click(function(){ 
        currentPage=5;
			 $("#riskSelected").text(rp);
   
     $(".contentMood .page4").hide();
        
        $(".pagination li:nth-child(4) a").css({"background-color":"#F2F5FB","color":"#FFDE15","border-color":"#FFDE15"});
        
        $(".pagination li:nth-child(5) a").css({"background-color":"#FFDE15","color":"#35BFD3","border-color":"#FFDE15"});
          
           
     $(".contentMood .page5, #yp, #riskSelected").show();
          }); 
	
	
	$(".moodGoals > img").click(function(){
	movingTo= currentPage-1;
	
		
		switch(movingTo){
				
			case 0: break;
			case 1: 
				$(".contentMood .page1").show();
		 
		$(".contentMood .page2, #goalIndicator").hide();
				currentPage=1;
			break;
				
			case 2: 
				$(".contentMood .page3, .page3Sub").hide();
				$(".contentMood .page2 .login-btn").css("top","65%");
				$(".contentMood .page2, #goalIndicator").show();
				 $(".page2 .dotHr").show();
				currentPage=2;
				once = true;
				break;
				
			case 3:
				$(".contentMood .page2, .contentMood .page3, .page3Sub").show();
				 $(".contentMood .page4").hide();
				currentPage=3;
				once = true;
				break;
				
			case 4:
				if(page4Risk == "dontKnow" ){
             currentPage=4;
            $(".contentMood .page4 .selectMode").hide();
            
            $(".contentMood .page4 .sub-page4").show();
            
}
				$(".contentMood .page5").hide();
				$(".contentMood .page4").show();
				currentPage=4;
				break;
		}

		nextPage = currentPage+1;
		 $(".moods .pagination li:nth-child("+nextPage+") a").css({"background-color":"#F2F5FB","color":"#FFDE15","border-color":"#FFDE15"});
        
        $(".pagination li:nth-child("+movingTo+") a").css({"background-color":"#FFDE15","color":"#35BFD3","border-color":"#FFDE15"});
		
});

	
});


	

var height = $( window ).height(); 
function resizeContent() {
    
   
   
 $("#section1,#section2,#section3,#section4").css("height",height);
   
}

