const asyncHandler=(requestHandler) => {
    return (req,res,next)=>{
            Promise.resolve(requestHandler(req,res,next)).catch((error)=>next(error))
    }
}

    

export {asyncHandler}

/*
const asyncHandler = (fn) => async(req,res,next) => {
    try{
        await fn(req,res,next);

    }catch(err){
        res.status(res.err || 500).json({
            success: false,
            message: err.message});
    }
}
*/