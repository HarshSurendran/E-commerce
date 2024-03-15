const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asynchandler");
const uploadOnCloudinary = require("../utils/cloudinary");


const ProductVarient = require("../models/productvarient.models");
const Product = require("../models/product.models.js");
const Color = require("../models/color.model.js");
const Size = require("../models/size.models.js");
const Category = require("../models/category.models.js");
const Cart = require("../models/cart.models.js");
const Wishlist = require("../models/wishlist.models.js");

const { checkOffer, applyOffer } = require("./offer.controller");


const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");


const addProductPage = asyncHandler( async (req,res)=>{
        
    const category = await Category.find({}).select("-createdAt -updatedAt ");
    
    if(!category){
        throw new ApiError(500,"server error while getting size and color")
    }
    
    res
    .status(200)
    .render("admin/addproduct",{admin:true, title:"Urbane Products", category});
});

const addProduct = asyncHandler( async (req,res)=>{
    //get the product details -Done
    //check wether the same product already exist -Done
    //add the product to the database -Done
    console.log(req.body);
    const {name,about,category,islisted} = req.body;
    console.log(typeof(name));

    const productExist = await Product.findOne({name});

    if(productExist){
        throw new ApiError(400,"Product already exist");
    }

    const categoryId = await Category.findOne({category})

    const product = await Product.create({
        name,
        about,
        category: categoryId._id,
        islisted
    });

    if(!product){
        throw new ApiError(500,"Something went wrong Product is not added in db");
    }

    console.log("Product is added to the db");
    
    return res
    .status(200)
    .json( new ApiResponse(200,
        product,
        "Product successfully added to db"
        )
    )
});

const onlyProductsList = asyncHandler( async (req,res)=>{
    //const products = await Product.find({}).select(" -updatedAt");
    const products = await Product.aggregate([
        {
            $lookup: {
                from: "categories",
                foreignField: "_id",
                localField: "category",
                as: "category"
            }
        },
        {
            $addFields: {
                category: { $first : "$category" }
            }
        },
        {
            $project: {
              _id: 1,
              date: {
                $dateToString: {
                  format: "%d-%m-%Y",
                  date: "$createdAt"
                }
              },
              name:1,
              about:1,
              category:1,
              islisted:1
            }
        }
    ]);

    if(!products){
        throw new ApiError(500, "Something went wrong while fetching product details");
    }

    const category = await Category.find({}).select("-createdAt -updatedAt");

    if(!category){
        throw new ApiError(500, "Something went wrong while fetching category details");
    }

    //const bestSellers = await ProductVarient.find({}).sort({sold_count: -1}).limit(10)
    const bestSellers = await ProductVarient.aggregate([
        {
            $lookup: {
                from: "products",
                localField : "product_id",
                foreignField : "_id",
                as: "name",
                pipeline: [
                    {
                        $match: {
                            islisted : true
                        }
                    },
                    {
                        $lookup: {
                            from: "categories",
                            localField: "category",
                            foreignField: "_id",
                            as: "category"
                        }
                    },
                    {
                        $addFields: {
                            category: { $first: "$category" }
                        }
                    }
                ]
            }        
        },
        {
            $lookup: {
                from: "colors",
                localField : "color_id",
                foreignField : "_id",
                as: "color"
            } 
        },
        {
            $lookup: {
                from: "sizes",
                localField : "size_id",
                foreignField : "_id",
                as: "size"
            } 
        },
        {            
            $addFields : {
                name : { $first: "$name" },
                color : { $first: "$color"},
                size : { $first: "$size" },
            }                       
        },
        {
            $sort: { sold_count: -1}
        },
        {
            $limit: 10 
        }
    ])
    console.log("this is the bestseller", bestSellers)

    res.render("admin/onlyProductList", {admin: true, title: "Urbane Wardrobe", products, category, bestSellers});
});

const editProductPage = asyncHandler ( async (req,res)=>{
    const id = req.params.id;
    console.log(id);   
    const product = await Product.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(id)}
        },
        {
            $lookup: {
                from: "categories",
                foreignField: "_id",
                localField: "category",
                as: "category"
            }
        },
        {
            $addFields: {
                category: { $first : "$category" }
            }
        },
        {
            $project: {
              _id: 1,
              date: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt"
                }
              },
              name:1,
              about:1,
              category:1,
              islisted:1
            }
          }
    ]);
    if(!product){
        throw new ApiError(500, "Something went wrong while fetching product details")
    }
    
    const prodDetails = product[0]
    
    const cat = await Category.find({}).select("-createdAt -updatedAt");

    if(!cat){
        throw new ApiError(500, "Something went wrong while fetching category details")
    }    

    res.render("admin/editProduct", {admin:true, title:"Urbane Wardrobe", prodDetails, cat})
});

const editProduct = asyncHandler( async(req,res)=>{
    
    const {id, name, about, category, islisted } = req.body    

    const catId = await Category.findOne({category}).select("-createdAt -updatedAt");

    const product = await Product.updateOne(
        {
            _id:id
        },
        {
            $set: {
                name, 
                about, 
                category: catId, 
                islisted
            }
        }
    );

    console.log(product);

    if(!product.acknowledged){
        throw new ApiError(500,"update failed");
    }

    res
    .status(200)
    .json( new ApiResponse(
        200,
        product,
        "productvarient uploaded successfully"
        )
    )
});

const deleteProduct = asyncHandler( async(req,res)=>{

    const id = req.params.id;

    try{
        const deleteProductVarient = await ProductVarient.deleteMany({product_id:id});
        const deleted = await Product.deleteOne({_id:id});
    }catch (error) {
        console.log("some error while deleting the product", error);
    }

    console.log("This is the response after deletion");    
    
    res
    .status(200)
    .redirect("/api/v1/admin/products");
});

const addProductVarientPage = asyncHandler( async(req,res)=>{    
    const color = await Color.find({}).select("-createdAt -updatedAt -hex");    
    const size = await Size.find({}).select("-createdAt -updatedAt ");

    if(!(color || size)){
        throw new ApiError(500,"server error while getting size and color")
    }    

    res
    .status(200)
    .render("admin/addproductVarient",{admin:true, title:"Urbane Wardrobe", color, size});
});

const addProductVarientPagewithId = asyncHandler( async(req,res)=>{
    const name = req.params.name;
    const color = await Color.find({}).select("-createdAt -updatedAt -hex");    
    const size = await Size.find({}).select("-createdAt -updatedAt ");

    if(!(color || size)){
        throw new ApiError(500,"server error while getting size and color")
    }    

    res
    .status(200)
    .render("admin/addproductVarientwithId",{admin:true, title:"Urbane Wardrobe", color, size, name});
})

const addProductVarient = asyncHandler( async (req,res)=>{
    //get product details  
    const {productname, color, size, stock, price, cost} = req.body 
    //collecting the _id from product,color and size 
    const productId = await Product.findOne({name:productname}).select("-name -about -category -islisted -createdAt -updatedAt");    
    const colorId = await Color.findOne({color:color}).select("-color -hex -createdAt -updatedAt");    
    const sizeId = await Size.findOne({size:size}).select("-size -createdAt -updatedAt");

    if(!(productId&&colorId&&sizeId)){
        //throw new ApiError(400,"The product size or color given is invalid");
        console.log("Product name is not matching");       
        
        return res
        .status(200)
        .render("admin/addproductVarient",{admin:true, title:"Urbane Wardrobe", color, size, error:"Product name doesn't exist"});
    }

    //File Handling
    if(!req.files){
        throw new ApiError(400,"The image path is null")
    }
    console.log(req.files);
    let urls = [];
  
    for(file of req.files){
        const uploadedToCloudinary = await uploadOnCloudinary(file.path);
        
        if(!uploadedToCloudinary){
            throw new ApiError(500,`Error in uploading file number ${ind}`)
        }

        urls.push(uploadedToCloudinary.url);
    }

    //add it to the database
    const productVarient = ProductVarient.create({
        product_id:productId._id,
        size_id:sizeId._id,
        color_id:colorId._id,        
        stock,
        price,
        cost,
        images: urls
    })

    if(!productVarient){
        throw new ApiError(500, "Something went wrong while uploading productvarient to database")
    }

    return res
    .status(200)
    // .json( new ApiResponse(
    //     200,
    //     productVarient,
    //     "productvarient uploaded successfully"
    //     )
    // )
    .redirect("products")
});

const editProductVarientPage = asyncHandler(async(req,res)=>{
    const id = req.params.id;

    const productVarientArray = await ProductVarient.aggregate([
        {
            $match: {
                _id : new mongoose.Types.ObjectId(id) 
            }
        },
        {
            $lookup: {
                from: "colors",
                localField : "color_id",
                foreignField : "_id",
                as: "color"
            } 
        },
        {
            $lookup: {
                from: "sizes",
                localField : "size_id",
                foreignField : "_id",
                as: "size"
            } 
        },
        {
            $addFields : {               
                color : { $first : "$color"},
                size : { $first : "$size"}
            }
        },
        {
            $project : {                
                color:1,
                size:1,
                images:1,
                stock:1,
                price:1,
                cost:1
            }
        }
    ]);

    let productVarient = productVarientArray[0];

    console.log("this is the product varient",productVarient);

    const color = await Color.find({}).select("-createdAt -updatedAt -hex");    
    const size = await Size.find({}).select("-createdAt -updatedAt ");

    if(!(color || size)){
        throw new ApiError(500,"server error while getting size and color")
    }

    res
    .status(200)
    .render("admin/editproductvarient",{admin:true, title:"Urbane Wardrobe", productVarient, color, size});

});

const editProductVarient = asyncHandler( async (req,res)=>{
    //get datas name, about, category, islisted, 
    //check whether every pic is edited
    const {prodId, color, size, stock, price, cost} = req.body
    console.log("this is request body",req.body)
    console.log("Thisi is req file", req.file)

    const colorData = await Color.findOne({color:color}).select(" -hex -createdAt -updatedAt");
    const sizeData = await Size.findOne({size:size}).select(" -createdAt -updatedAt");

    const edited = await ProductVarient.updateOne(
        {
            _id : prodId 
        },
        {
            $set : { color_id : colorData._id, size_id : sizeData._id, stock, price, cost}
        });

        if(!edited){
            throw new ApiError(500, "Something went wrong while editing productvarient")
        }

        return res
        .status(200)
        .redirect("/api/v1/admin/products")

});

const listProducts = asyncHandler( async(req,res)=>{    
    //data for layout
    const categorylayout = await Category.find({});
    let wishlistCountlayout = 0;
    let wishlistlayout = await Wishlist.find({userId: req.user._id})
    wishlistlayout = wishlistlayout[0];
    if (wishlistlayout?.productsId.length) {
        wishlistlayout.productsId.forEach(element => {
            wishlistCountlayout++;
        });        
    }
    const cartCountlayout = await Cart.find({user_id: req.user._id}).countDocuments();
    //end of data for layout

    const product = await ProductVarient.aggregate(
    [   
        {
            $lookup: {
                from: "products",
                localField : "product_id",
                foreignField : "_id",
                as: "name",
                pipeline: [
                    {
                        $match: {
                            islisted : true
                        }
                    },
                    {
                        $lookup: {
                            from: "categories",
                            localField: "category",
                            foreignField: "_id",
                            as: "category"
                        }
                    },
                    {
                        $addFields: {
                            category: { $first: "$category" }
                        }
                    }
                ]
            }        
        },
        {
            $lookup: {
                from: "colors",
                localField : "color_id",
                foreignField : "_id",
                as: "color"
            } 
        },
        {
            $lookup: {
                from: "sizes",
                localField : "size_id",
                foreignField : "_id",
                as: "size"
            } 
        },
        {            
            $addFields : {
                name : { $first: "$name" },
                color : { $first: "$color"},
                size : { $first: "$size" },
            }                       
        },
        {
            $project : {
                name:1,
                color:1,
                size:1,
                images:1,
                stock:1,
                price:1
            }
        }
    ]
    );    

    const productList = await Promise.all(product.map(async (element) => {
        if (element.stock < 1) {
            element.isOutofStock = true;            
        }
        const isWishlisted = await Wishlist.findOne({ userId: req.user._id, productsId: element._id });
        if (isWishlisted) {
            element.isWishlisted = true;
        } else {
            element.isWishlisted = false;
        }
        const offer = await checkOffer(element.name?.category?.category);
        if (offer) {
            element.originalprice = element.price;
            element.price = applyOffer(element.price, offer.discount);
            element.offerApplied = true;
        }   
        return element; 
    }));
    
    //rearranging outofstock elements to the last
    const outOfStockProducts = productList.filter(product => product.isOutofStock);
    const inStockProducts = productList.filter(product => !product.isOutofStock);
    const rearrangedProducts = [...inStockProducts, ...outOfStockProducts];

    const colors = await Color.find({}).select("-createdAt -updatedAt -hex");    

    res
    .status(200)
    .render("users/productlist",{user:req.user, products: rearrangedProducts, colors, title: "Urbane Wardrobe", categorylayout, wishlistCountlayout, cartCountlayout});
});

const productDetailsPage = asyncHandler( async(req,res)=>{
    const prodId = req.params.id;
    
    //data for layout
    const categorylayout = await Category.find({});
    let wishlistCountlayout = 0;
    let wishlistlayout = await Wishlist.find({userId: req.user._id})
    wishlistlayout = wishlistlayout[0];
    if (wishlistlayout?.productsId.length) {
        wishlistlayout.productsId.forEach(element => {
            wishlistCountlayout++;
        });        
    }
    const cartCountlayout = await Cart.find({user_id: req.user._id}).countDocuments();
    //end data layout

    const prod = await ProductVarient.aggregate([
        {
            $match: {
                _id : new mongoose.Types.ObjectId(prodId) 
            }
        },
        {
            $lookup : {
                from : "products",
                localField : "product_id",
                foreignField : "_id",
                as : "name",
                pipeline : [
                    {
                        $lookup: {
                            from: "categories",
                            localField: "category",
                            foreignField: "_id",
                            as: "category"
                        }
                    },
                    {
                        $addFields: {
                            category: { $first: "$category" }
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "colors",
                localField : "color_id",
                foreignField : "_id",
                as: "color"
            } 
        },
        {
            $lookup: {
                from: "sizes",
                localField : "size_id",
                foreignField : "_id",
                as: "size"
            } 
        },
        {
            $addFields : {
                name : { $first : "$name"},
                color : { $first : "$color"},
                size : { $size : "$size"}
            }
        },
        {
            $project : {
                name:1,
                color:1,
                size:1,
                images:1,
                stock:1,
                price:1
            }
        }
    ]);


    if(prod.length === 0){
        return res
        .status(400)
        .render("error")        
    }

    const cartItem = await Cart.findOne({user_id : req.user._id , productVarient_id : prodId}).select(" -createdAt -updatedAt");
    console.log("This is cart item ", cartItem);
    let cart;
    if(cartItem){
        cart = true;
    }else{
        cart = false;
    }

    const prodDetails = prod[0];
   

    const isWishlisted = await Wishlist.findOne({ userId: req.user._id, productsId: prodDetails._id });    
    if (isWishlisted) {
        prodDetails.isWishlisted = true;
    } else {
        prodDetails.isWishlisted = false;
    }   
    
    const mainProdId = prodDetails.name._id;    
    if (prodDetails.stock < 1) {
        prodDetails.isOutOfStock = true;
    }
    
    //to get the other varient of this product
    const prodVarients = await ProductVarient.aggregate([
        {
            $match: {
                product_id : new mongoose.Types.ObjectId(mainProdId) 
            }
        },
        {
            $lookup : {
                from : "products",
                localField : "product_id",
                foreignField : "_id",
                as : "name",
                pipeline : [
                    {
                        $lookup: {
                            from: "categories",
                            localField: "category",
                            foreignField: "_id",
                            as: "category"
                        }
                    },
                    {
                        $addFields: {
                            category: { $first: "$category" }
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "colors",
                localField : "color_id",
                foreignField : "_id",
                as: "color"
            } 
        },
        {
            $lookup: {
                from: "sizes",
                localField : "size_id",
                foreignField : "_id",
                as: "size"
            } 
        },
        {
            $addFields : {
                name : { $first : "$name"},
                color : { $first : "$color"},
                size : { $first : "$size"}
            }
        },
        {
            $project : {
                name:1,
                color:1,
                size:1,
                images:1,
                stock:1,
                price:1
            }
        }
    ]);

    //check whether offer is applied
    const offer = await checkOffer(prodDetails.name?.category?.category);
    if (offer) {
        prodDetails.originalprice = prodDetails.price;
        prodDetails.price = applyOffer(prodDetails.price, offer.discount);
        prodDetails.offerApplied = true;
    }  
    
    res
    .status(200)
    .render("proddetails", {user:req.user, title:"Urbane Wardrobe", product: prodDetails, prodVarients, cart, wishlistCountlayout, cartCountlayout, categorylayout});
});

const listUnlistProduct = asyncHandler( async(req,res)=>{
    const id = req.params.id;
    console.log(id);
    const product = await Product.findOne({_id:id})

    if(!product){
        res
        .status(400)
        .json( new ApiError(400,"Bad request product id is not valid"))
    }

    if(product.islisted == true){
        console.log("Entered islisted true");
        const Updated = await Product.updateOne({_id:id},{
            $set: { islisted: false }
        });
    }else{
        console.log("Entered islisted false");
        const Updated = await Product.updateOne({_id:id},{
            $set: { islisted: true }
        });    
    }

    res
    .status(200)
    .json( new ApiResponse(200, {}, "task success"))
});

const categoryListPage = asyncHandler( async(req,res)=>{
    const category = req.params.category;
    //data for layout
    const categorylayout = await Category.find({});
    let wishlistCountlayout = 0;
    let wishlistlayout = await Wishlist.find({userId: req?.user?._id})
    wishlistlayout = wishlistlayout[0];
    if (wishlistlayout?.productsId.length) {
        wishlistlayout.productsId.forEach(element => {
            wishlistCountlayout++;
        });        
    }
    const cartCountlayout = await Cart.find({user_id: req?.user?._id}).countDocuments();

    const categoryProductList = await ProductVarient.aggregate(
        [   
            {
                $lookup: {
                    from: "products",
                    localField : "product_id",
                    foreignField : "_id",
                    as: "name",
                    pipeline: [
                        {
                            $match: {
                                islisted : true,
                            }
                        },
                        {
                            $lookup: {
                                from: "categories",
                                localField: "category",
                                foreignField: "_id",
                                as: "category",
                                pipeline: [
                                    {
                                        $match: {
                                            category: category
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields: {
                                category: { $first: "$category" }
                            }
                        }
                    ]
                }        
            },
            {
                $lookup: {
                    from: "colors",
                    localField : "color_id",
                    foreignField : "_id",
                    as: "color"
                } 
            },
            {
                $lookup: {
                    from: "sizes",
                    localField : "size_id",
                    foreignField : "_id",
                    as: "size"
                } 
            },
            {            
                $addFields : {
                    name : { $first: "$name" },
                    color : { $first: "$color"},
                    size : { $first: "$size" },
                }                       
            },
            {
                $project : {
                    name:1,
                    color:1,
                    size:1,
                    images:1,
                    stock:1,
                    price:1
                }
            }
        ]
        );
        
    const products = categoryProductList.filter((element)=>{
        if(element.name?.category){
            return true
        }
        return false
    });

    const categoryProducts = await Promise.all(products.map(async (element) => {
        if (element.stock < 1) {
            element.isOutofStock = true;            
        }
        const isWishlisted = await Wishlist.findOne({ userId: req?.user?._id, productsId: element._id });
        console.log("isWishlisted", isWishlisted);
        if (isWishlisted) {
            element.isWishlisted = true;
        } else {
            element.isWishlisted = false;
        }
        const offer = await checkOffer(element.name?.category.category);
        if (offer) {
            element.originalprice = element.price;
            element.price = applyOffer(element.price, offer.discount);
            element.offerApplied = true;
        } 
        return element;
    }));

    //rearranging outofstock elements to the last
    const outOfStockProducts = categoryProducts.filter(product => product.isOutofStock);
    const inStockProducts = categoryProducts.filter(product => !product.isOutofStock);
    const rearrangedProducts = [...inStockProducts, ...outOfStockProducts];


    res
    .status(200)
    .render("users/categoryproductlist",{title:"Urbane Wardrobe", user: req.user, products: rearrangedProducts , categorylayout, wishlistCountlayout, cartCountlayout});
});

const productVarientDetailsPage = asyncHandler( async(req,res)=>{        
    productId = req.params.id;
    console.log("this is product id",productId);

    const productArray = await Product.aggregate([
        { 
            $match: { 
                _id: new mongoose.Types.ObjectId(productId),
            } 
        },
        {            
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $addFields: {
                category: { $first: "$category" }
            }
        }
        
    ]);
    //const product = await Product.findOne({_id:productId}).populate("categories");

    let product = productArray[0];

    

    const productVarient = await ProductVarient.aggregate([
        {
            $match: {
                product_id : new mongoose.Types.ObjectId(productId) 
            }
        },
        {
            $lookup: {
                from: "colors",
                localField : "color_id",
                foreignField : "_id",
                as: "color"
            } 
        },
        {
            $lookup: {
                from: "sizes",
                localField : "size_id",
                foreignField : "_id",
                as: "size"
            } 
        },
        {
            $addFields : {               
                color : { $first : "$color"},
                size : { $first : "$size"}
            }
        },
        {
            $project : {                
                color:1,
                size:1,
                images:1,
                stock:1,
                price:1
            }
        }
    ]);

    

    res
    .status(200)
    .render("admin/productdetails",{admin:true, title:"Urbane Wardrobe", product, productVarient});


});

const uploadImage = asyncHandler( async(req,res)=>{
    const {index,productId, cropedImage} = req.body;    
    
    console.log("this is index", index);
    console.log("this is productId", productId);    

    const imageBuffer = Buffer.from(cropedImage.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    // Generate a unique filename for the image
    const filename = `image_${Date.now()}.jpg`;
    const imagePath = path.join(__dirname, '../../public/temp', filename);
    
    // Write the image buffer to a file
    fs.writeFile(imagePath, imageBuffer, (err) => {
        if (err) {
            console.error('Error writing image file:', err);
            //res.status(500).json('Error uploading image');
        } else {
            console.log('Image uploaded successfully:', filename);
            //res.status(200).json('Image uploaded successfully');
        }
    });

    
    const uploadedToCloudinary = await uploadOnCloudinary(imagePath);
    
    if(!uploadedToCloudinary){
        throw new ApiError(500,`Error in uploading file number ${index}`);
    }

    const prodUpdate = await ProductVarient.updateOne(
        {
            _id: new mongoose.Types.ObjectId(productId)
        },
        { 
            $set : { 
                [`images.${index}`] : uploadedToCloudinary.url 
            }
        }
        )


        if(prodUpdate){
            return res.status(200).json(uploadedToCloudinary.url);
        }

        res.status(500).json("Something went wrong");
    
});

const addColor = asyncHandler( async(req,res)=>{

    const {color, hex }= req.body;
    
    const colorExist = await Color.findOne({color});

    if(colorExist){
        throw new ApiError(400, "Color already exist.");
    }

    const col = await Color.create({
        color,
        hex
    });

    if(!col){
        throw new ApiError(500, "Something went wrong while uploading color to database");
    }

    return res.
    status(200)
    .json( new ApiResponse(200,col,"Color added successfully"));
})

const deleteColor = asyncHandler( async(req,res)=>{
    console.log(req.params.id);
    const colorid = req.params.id;

    const isSuccess = await Color.deleteOne({_id:colorid});

    if(!isSuccess){
        throw new ApiError(500, "Something went wrong while deleting Color")
    }

    return res
    .status(200)
    .json( new ApiResponse(200,{},"Color deleted successfully"));
});

const addSize = asyncHandler( async(req,res)=>{
    const {size} = req.body;

    const sizeExist = await Size.findOne({size});

    if(sizeExist){
        throw new ApiError(400,"Size already exists");
    }

    const createdSize = await Size.create({
        size
    });

    if(!createdSize){
        throw new ApiError(500,"Something went wrong while uploading size to db");
    }

    return res
    .status(200)
    .json( new ApiResponse(
        200,
        createdSize,
        "Size successfully created"
    ));

})

const deleteSize = asyncHandler( async(req,res)=>{

    console.log(req.params.id);
    const sizeId = req.params.id;

    const isSuccess = await Size.deleteOne({_id:sizeId});

    if(!isSuccess){
        throw new ApiError(500, "Something went wrong while deleting size")
    }

    return res
    .status(200)
    .json( new ApiResponse(200,{},"Size deleted successfully"));
})

const filterByPrice = asyncHandler(async (req, res) => {
    const categorylayout = await Category.find({});
    let wishlistCountlayout = 0;
    let wishlistlayout = await Wishlist.find({userId: req.user._id})
    wishlistlayout = wishlistlayout[0];
    if (wishlistlayout?.productsId.length) {
        wishlistlayout.productsId.forEach(element => {
            wishlistCountlayout++;
        });        
    }
    const cartCountlayout = await Cart.find({user_id: req.user._id}).countDocuments();
    //colors for filter options
    const colors = await Color.find({}).select("-createdAt -updatedAt -hex");

    let { min, max } = req.params;    
    min = parseInt(min);
    max = parseInt(max);

    const product = await ProductVarient.aggregate(
        [   
            {
                $match: {
                    price: {
                        $gte: min,
                        $lte: max,
                    }
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField : "product_id",
                    foreignField : "_id",
                    as: "name",
                    pipeline: [
                        {
                            $match: {
                                islisted : true
                            }
                        },
                        {
                            $lookup: {
                                from: "categories",
                                localField: "category",
                                foreignField: "_id",
                                as: "category"
                            }
                        },
                        {
                            $addFields: {
                                category: { $first: "$category" }
                            }
                        }
                    ]
                }        
            },
            {
                $lookup: {
                    from: "colors",
                    localField : "color_id",
                    foreignField : "_id",
                    as: "color"
                } 
            },
            {
                $lookup: {
                    from: "sizes",
                    localField : "size_id",
                    foreignField : "_id",
                    as: "size"
                } 
            },
            {            
                $addFields : {
                    name : { $first: "$name" },
                    color : { $first: "$color"},
                    size : { $first: "$size" },
                }                       
            },
            {
                $project : {
                    name:1,
                    color:1,
                    size:1,
                    images:1,
                    stock:1,
                    price:1
                }
            }
        ]
        );  
    
   
    if (!product || product.length === 0) {
        const message = "Currently there are no products in this price range";
        return res
        .status(200)
        .render("users/productlist", { title:"Urbane Wardrobe", user:req.user, message, categorylayout,  colors, wishlistCountlayout, cartCountlayout});
    }
    
    const productList = await Promise.all(product.map(async (element) => {
        if (element.stock < 1) {
            element.isOutofStock = true;            
        }
        const isWishlisted = await Wishlist.findOne({ userId: req.user._id, productsId: element._id });
        if (isWishlisted) {
            element.isWishlisted = true;
        } else {
            element.isWishlisted = false;
        }
        const offer = await checkOffer(element.name?.category?.category);
        if (offer) {
            element.originalprice = element.price;
            element.price = applyOffer(element.price, offer.discount);
            element.offerApplied = true;
        }   
        return element; 
    }));
    
    //rearranging outofstock elements to the last
    const outOfStockProducts = productList.filter(product => product.isOutofStock);
    const inStockProducts = productList.filter(product => !product.isOutofStock);
    const rearrangedProducts = [...inStockProducts, ...outOfStockProducts];  
    
    

   return res
   .status(200)
   .render("users/productlist", { title:"Urbane Wardrobe", user:req.user, products: rearrangedProducts, colors, categorylayout, wishlistCountlayout, cartCountlayout});
});

const filterByColor = asyncHandler(async (req, res) => {
    const categorylayout = await Category.find({});
    let wishlistCountlayout = 0;
    let wishlistlayout = await Wishlist.find({userId: req.user._id})
    wishlistlayout = wishlistlayout[0];
    if (wishlistlayout?.productsId.length) {
        wishlistlayout.productsId.forEach(element => {
            wishlistCountlayout++;
        });        
    }
    const cartCountlayout = await Cart.find({user_id: req.user._id}).countDocuments();
    //colors for filter options
    const colors = await Color.find({}).select("-createdAt -updatedAt -hex");

    const color = req.params.color;
    const colorData = await Color.find({ color });
    console.log("Color data", colorData);

    if (!colorData || colorData.length === 0) {
        const message = "Can't find any products with this color";
        return res
        .status(200)
        .render("users/productlist", { title:"Urbane Wardrobe", user:req.user, message, colors, categorylayout, wishlistCountlayout, cartCountlayout});      
    }
    
    const product = await ProductVarient.aggregate(
        [   
            {
                $match: {
                    color_id: new mongoose.Types.ObjectId(colorData[0]._id) 
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField : "product_id",
                    foreignField : "_id",
                    as: "name",
                    pipeline: [
                        {
                            $match: {
                                islisted : true
                            }
                        },
                        {
                            $lookup: {
                                from: "categories",
                                localField: "category",
                                foreignField: "_id",
                                as: "category"
                            }
                        },
                        {
                            $addFields: {
                                category: { $first: "$category" }
                            }
                        }
                    ]
                }        
            },
            {
                $lookup: {
                    from: "colors",
                    localField : "color_id",
                    foreignField : "_id",
                    as: "color"
                } 
            },
            {
                $lookup: {
                    from: "sizes",
                    localField : "size_id",
                    foreignField : "_id",
                    as: "size"
                } 
            },
            {            
                $addFields : {
                    name : { $first: "$name" },
                    color : { $first: "$color"},
                    size : { $first: "$size" },
                }                       
            },
            {
                $project : {
                    name:1,
                    color:1,
                    size:1,
                    images:1,
                    stock:1,
                    price:1
                }
            }
        ]
        );  
    
   
    if (!product || product.length === 0) {
        const message = "Currently there are no products with this color. Try other colors.";
        return res
        .status(200)
        .render("users/productlist", { title:"Urbane Wardrobe", user:req.user, message, categorylayout, colors, wishlistCountlayout, cartCountlayout});
    }
    
    const productList = await Promise.all(product.map(async (element) => {
        if (element.stock < 1) {
            element.isOutofStock = true;            
        }
        const isWishlisted = await Wishlist.findOne({ userId: req.user._id, productsId: element._id });
        if (isWishlisted) {
            element.isWishlisted = true;
        } else {
            element.isWishlisted = false;
        }
        const offer = await checkOffer(element.name?.category?.category);
        if (offer) {
            element.originalprice = element.price;
            element.price = applyOffer(element.price, offer.discount);
            element.offerApplied = true;
        }   
        return element; 
    }));
    
    //rearranging outofstock elements to the last
    const outOfStockProducts = productList.filter(product => product.isOutofStock);
    const inStockProducts = productList.filter(product => !product.isOutofStock);
    const rearrangedProducts = [...inStockProducts, ...outOfStockProducts];

   

    return res
    .status(200)     
    .render("users/productlist", { title:"Urbane Wardrobe", user:req.user, products: rearrangedProducts, colors, categorylayout, wishlistCountlayout, cartCountlayout});

});

const bestSellerProducts = asyncHandler(async (req, res) => {

    const product = await ProductVarient.aggregate(
        [   
            {
                $lookup: {
                    from: "products",
                    localField : "product_id",
                    foreignField : "_id",
                    as: "name",
                    pipeline: [
                        {
                            $match: {
                                islisted : true
                            }
                        },
                        {
                            $lookup: {
                                from: "categories",
                                localField: "category",
                                foreignField: "_id",
                                as: "category"
                            }
                        },
                        {
                            $addFields: {
                                category: { $first: "$category" }
                            }
                        }
                    ]
                }        
            },
            {
                $lookup: {
                    from: "colors",
                    localField : "color_id",
                    foreignField : "_id",
                    as: "color"
                } 
            },
            {
                $lookup: {
                    from: "sizes",
                    localField : "size_id",
                    foreignField : "_id",
                    as: "size"
                } 
            },
            {            
                $addFields : {
                    name : { $first: "$name" },
                    color : { $first: "$color"},
                    size : { $first: "$size" },
                }                       
            },
            {
                $project : {
                    name:1,
                    color:1,
                    size:1,
                    images:1,
                    stock:1,
                    price:1,
                    sold_count:1
                }
            },
            {
                $sort :{
                    sold_count: -1
                }
            },
            {
                $limit : 10
            }
        ]
        );          
            
    const productList = await Promise.all(product.map(async (element) => {
        if (element.stock < 1) {
            element.isOutofStock = true;            
        }
        const isWishlisted = await Wishlist.findOne({ userId: req.user._id, productsId: element._id });
        if (isWishlisted) {
            element.isWishlisted = true;
        } else {
            element.isWishlisted = false;
        }
        const offer = await checkOffer(element.name?.category?.category);
        if (offer) {
            element.originalprice = element.price;
            element.price = applyOffer(element.price, offer.discount);
            element.offerApplied = true;
        }
        return element; 
    }));

    console.log("products after filter", productList);
    
    return res
    .status(200)
    .json(new ApiResponse(200, {productList}, "fetched product data"))
});


module.exports = {
    addProductVarient,
    addProduct,
    listProducts,
    addProductPage,
    onlyProductsList,
    editProductPage,
    editProduct,
    deleteProduct,
    addProductVarientPage,
    productDetailsPage,
    listUnlistProduct,    
    categoryListPage,
    productVarientDetailsPage,
    editProductVarientPage,
    editProductVarient,
    uploadImage,
    addProductVarientPagewithId,
    addColor,
    deleteColor,
    addSize,
    deleteSize,
    filterByPrice,
    filterByColor,
    bestSellerProducts
}