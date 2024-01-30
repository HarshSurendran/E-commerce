document.addEventListener("DOMContentLoaded", ()=>{
    //const unBlockButton = document.getElementById("unBlockButton");
    const blockButton = document.getElementById("blockButton");

    function blocker (){
        console.log("THis is blocker function")
        const value = document.getElementById("blockButton").value;
        const id = blockButton.getAttribute("data-id");

        if(id==""){
            return
        }

        if (value == "Block"){
           
            console.log("This is the id coming from unblockuser fetch",id)

            fetch("/api/v1/admin/usermanagement-block", { 
                method : "PATCH",
                headers: {
                    "content-type" : "application/json"
                },
                body: JSON.stringify({
                    id
                })
            })
            .then( (res)=>{
                console.log(res)
                if(res.ok){
                blockButton.classList.remove("btn-danger");
                blockButton.classList.add("btn-brand");                
                blockButton.innerText = "Unblock"                
                }
            })
        }else if(value == "Unblock") {

            console.log("This is the id coming from unblockuser fetch",id)

            fetch("/api/v1/admin/usermanagement-unblock", { 
                method : "PATCH",
                headers: {
                    "content-type" : "application/json"
                },
                body: JSON.stringify({
                    id
                })
            })
            .then( (res)=>{
                console.log(res)
                if(res.ok){
                unBlockButton.classList.remove("btn-brand");
                unBlockButton.classList.add("btn-danger");                
                unBlockButton.innerText = "Block"                
                }
            });
        }
    }