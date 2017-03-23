  
function setProfile(profileRate, table, storeAllocation){

	var riskProfile = "";
	var tableNo = "";
	
	if(table == 1){
		tableNo = "";
	}else {
		tableNo = "1";
	}
	
	switch(profileRate)
		{
				
			case 0: riskProfile="Conservative";
				break;
			case 1: riskProfile="Moderate";
				break;
			case 2: riskProfile="Aggressive";
				break;
			default: riskProfile="Conservative";
				
		}
	
	showRiskProfile(riskProfile);
	myinit(riskProfile, tableNo,storeAllocation);
	
}

    function myScore() {

         var total=0;
		var getRisk= 0;
        var selectedAnswer = "";
        var allRadio = document.getElementsByTagName("input");
		
        for(var i = 0;i<allRadio.length; i++){
            if(allRadio[i].checked == true){

                var a =parseInt(allRadio[i].value);

                  if(a==0)
                  total=total+((35*2)/10);
               else if(a==1)
                   total=total+((50*2)/10);
               else
                   total=total+((80*2)/10);

            }
        }
     if(total<=42){
		
		 console.log("conservative");
		getRisk= 0;
	 }
         
         else if(total>=43 && total<=62){
		
			 	 console.log("Moderate");
			getRisk =1;
		 }
            
      else{
		 
		  	 console.log("Aggressive");
		 getRisk =2;
}
  
		setProfile(getRisk,2,1);
		
}
