const asyncHandler = (requestHandler) => (req,res,next) => {
    Promise.resolve(requestHandler(req,res,next))
    .catch((err)=>{
        console.log("This is asynchandler catch",err);
        next(err)
    });
}

module.exports = asyncHandler