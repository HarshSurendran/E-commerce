
   
    const addForm = document.getElementById("addForm");
    let repeatCount = 0;     
    function repeatForm() {
        console.log("This is repeatform event listener");
        repeatCount++;
        const productVarientForm = document.getElementById("productVarientForm");
        //const form = document.getElementById("form");
        const cloneForm = target.cloneNode(true);
        cloneForm.id = `productVarientForm${repeatCount}`;
        cloneForm.reset();
        parentSection.appendChild(productVarientForm);
    }    
    addForm.addEventListener("click", repeatForm);


    const varientAlert = document.getElementById("varientAlert")
    function addProductVarient() {
        const color = document.getElementById("color").value;
        const size = document.getElementById("size").value;
        const price = document.getElementById("price").value;
        const cost = document.getElementById("cost").value;
        const stock = document.getElementById("stock").value;
        const productName= document.getElementById("productName").value;

        fetch("/api/v1/admin/products-varient",{
            method: "post",
            headers : {
                content-type : "application/json"
            },
            body: JSON.stringify({
                productname : productName,
                color,
                size,
                stock,
                price,
                cost
            })
        }).then((res)=>{
            if(!res.ok){
                varientAlert.innerText = "Product varient is not added."
            }
            
            price.innerText = 0;
            cost.innerText = 0;
            stock.innerText = 0;            
        })

    }

    function previewImage(event) {
        const input = event.target;
        console.log(input)
        const preview = document.getElementById('image-preview');

        if (input.files && input.files[0]) {
            const reader = new FileReader();

            reader.onload = function (e) {
                preview.src = e.target.result;
            };

            reader.readAsDataURL(input.files[0]);
        }
    }











    blocka and unblocxk
    function unBlockUser(){
        const id = unBlockButton.getAttribute("data-id");
        if(id==""){
            return
        }
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
            unBlockButton.removeAttribute("id");
            unBlockButton.innerText = "Block"
            unBlockButton.setAttribute("id","blockButton");
            }
         })
    }

    function blockUser(){
        console.log("Entered blockuser function")
        const id = blockButton.getAttribute("data-id");
        if(id==""){
            return
        }
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
            blockButton.removeAttribute("id");
            blockButton.innerText = "Unblock"
            blockButton.setAttribute("id","unBlockButton");
            }
         })
    }