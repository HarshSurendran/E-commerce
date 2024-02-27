const Order = require("../models/order.models.js");


async function changeStatusToShipped() {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);   
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const orders = await  Order.find({ 
        createdAt: { 
            $gt: fiveDaysAgo, 
            $lt: twoDaysAgo   
        } 
    })

    orders.forEach(element => {  
        if (element.status == "Placed") {
            element.status = "Shipped";
            element.save({ validateBeforeSave:false });          
        }
    });

    console.log("These are the orders", orders);
}
async function changeStatusToDelivered() {     
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const orders = await  Order.find({ 
        createdAt: { 
            $lt: fiveDaysAgo,            
        } 
    })

    orders.forEach(element => {
        if (element.status == "Shipped") {
            element.status = "Delivered";
            if(element.paymentMethod == "COD"){
                element.paymentStatus = "Paid";
            }
            element.returnPeriod = true;
            element.paymentStatus = "Paid";
            element.save({ validateBeforeSave:false });          
        }
    });

    console.log("These are the orders", orders);
}
async function changeStatusToReview() {     
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

    const orders = await  Order.find({ 
        createdAt: { 
            $lt: twentyDaysAgo, // Greater than twenty days ago            
        } 
    })

    orders.forEach(element => {
        if (element.status == "Delivered") {  
            element.returnPeriod = false;
            element.save({ validateBeforeSave:false });          
        }
    });

    console.log("These are the orders", orders);
}

module.exports = {
    changeStatusToShipped,
    changeStatusToDelivered,
    changeStatusToReview
}