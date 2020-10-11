var tag='';
$("#select1").change(function(){
        var selectedOption = $(this).children("option:selected").val();
        $("#select2").removeClass("hideElement");
        if(selectedOption=="Computer"){
          tag="";
          $("#select2 option").remove();
          tag='<option disabled selected value="none">Chose sub catagory</option><option value="All development">All development</option><option value="Data Science">Data Science</option><option value="AI">Artificial Intelligence</option><option value="Machine Learning">Machine Learning</option>'
          $("#select2").append(tag);

        }
        if(selectedOption=="Business"){
          $("#select2 option").remove();
          tag='<option disabled selected value="none">Chose sub catagory</option><option value="Finance">Finance</option><option value="Enterpreneurship">Enterpreneurshipt</option>';
          $("#select2").append(tag);
        }
        if(selectedOption=="Design"){
          $("#select2 option").remove();
          tag='<option disabled selected value="none">Chose sub catagory</option><option value="Web design">Web design</option><option value="Fashion">Fashion</option>';
          $("#select2").append(tag);
        }
      });
