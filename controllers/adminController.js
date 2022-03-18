const Staff = require('../models/staff')
const passport = require('passport');
const Ticket = require('../models/ticket')
const multer = require('multer');
const {singleUpload,singleFileUpload} = require('../middlewares/filesMiddleware');
const { uuid } = require('uuidv4');
const jwt =require('jsonwebtoken');
const csv = require('csv-parser')
const fs = require('fs')
const msToTime = require('../middlewares/timeMiddleware')
const math = require('../middlewares/math.middleware')
const randomstring = require("randomstring");
const cloudinary = require('cloudinary');
const mailgun = require("mailgun-js");
const Voucher = require('../models/voucher');
const DOMAIN = "sandbox09949278db4c4a108c6c1d3d1fefe2ff.mailgun.org";
const mg = mailgun({apiKey: "9bd20544d943a291e8833abd9e0c9908-76f111c4-8a189b96", domain: DOMAIN});


// cloudinary configuration for saving files
cloudinary.config({
    cloud_name: 'mustyz',
    api_key: '727865786596545',
    api_secret: 'HpUmMxoW8BkmIRDWq_g2-5J2mD8'
})

exports.mall = async (req,res,next) => {
  cloudinary.v2.api.delete_resources_by_prefix('bc7crytwzlexeg8ubxt3.jpg', 
  {
    invalidate: true,
    resource_type: "raw"
}, 
  function(error,result) {
    console.log(result, error) });   

} 
// staff registration controller
exports.registerStaff = async (req, res, next) => {
  try {

    //create the user instance
    user = new Staff(req.body)
    const password = req.body.password ? req.body.password : 'password'
    //save the user to the DB
    await Staff.register(user, password, function (error, user) {
      if (error) return res.json({ success: false, error }) 
      const newUser = {
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        __v: user.__v
      }
      const dataMsg = {
        from: "MAU@gmail.com",
        to: "onemustyfc@gmail.com",
        subject: "MAU DEFAULT PASSWORD",
        text: "Your default password is 'password'"
      };
      try {
        
        mg.messages().send(dataMsg, function (error, body) {
          console.log(body);
        });
        res.json({ success: true, newUser })
      } catch (error) {
        res.json({ success: false, newUser })
      }
    })
  } catch (error) {
    res.json({ success: false, error })
  }



}


  // reset password
  exports.changePassword = async (req, res, next) => {
    const {username} = req.query
    Staff.findOne({ username },(err, user) => {
      // Check if error connecting
      if (err) {
        res.json({ success: false, message: err }); // Return error
      } else {
        // Check if user was found in database
        if (!user) {
          res.json({ success: false, message: 'User not found' }); // Return error, user was not found in db
        } else {
          user.changePassword(req.body.oldpassword, req.body.newpassword, function(err) {
             if(err) {
                      if(err.name === 'IncorrectPasswordError'){
                           res.json({ success: false, message: 'Incorrect password' }); // Return error
                      }else {
                          res.json({ success: false, message: 'Something went wrong!! Please try again after sometimes.' });
                      }
            } else {
              res.json({ success: true, message: 'Your password has been changed successfully' });
             }
           })
        }
      }
    });
  }

exports.forgetPassword = async (req,res,next) => {

  const newPassword = math.randomNumber()
  try {

      const user = await Staff.findOne({
        username: req.query.username
    });
    await user.setPassword(newPassword.toString());
    const updatedUser = await user.save();
    const data = {
      from: "MAU@gmail.com",
      to: "onemustyfc@gmail.com",
      subject: "CHANGED PASSWORD",
      text: `Your new password is ${newPassword}`
    };
    mg.messages().send(data, function (error, body) {
      console.log(body);
    });
    res.json({success:true, message:"Password have been reset and sent to email"})
  } catch (error) {
    res.json({success:false, message:error})
  }
    
}

  // staff login controller
exports.loginStaff = (req, res, next) => {

  let payLoad = {}
  // perform authentication
  passport.authenticate('staff', (error, user, info) => {
    if (error) return res.json({ success: false, error })
    if (!user)
      return res.json({
        success: false,
        message: 'username or password is incorrect'
      })
    //login the user  
    req.login(user, (error) => {
      if (error){
        res.json({ success: false, message: 'something went wrong pls try again' })
      }else {
        req.session.user = user
        payLoad.id = user.username
        const token = jwt.sign(payLoad, 'myVerySecret');

        const newUser = {
          token: token,
          _id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          __v: user.__v
        }
        
        res.json({ success: true, message: 'staff login successful', newUser})
      }
    })
  })(req, res, next)
}

 

// logout
exports.logout = (req, res,next) => {

  console.log(req.session)

  if (req.session.user.role == "admin"){

      req.logout();
      res.json({success: true, message: "logout successfully"});
  }
}

// find all staff
exports.findAllStaff = async (req,res, next) => {

  const result = await Staff.find({});
  result.length > 0
   ? res.json({success: true, message: result,})
   : res.json({success: false, message: result,})
}


// find single staff
exports.singleStaff = async (req,res, next) => {
  const {username} = req.query

  const result = await Staff.findOne({username: username});
  result
   ? res.json({success: true, message: result,})
   : res.json({success: false, message: result,})
}

// set profile pic
exports.setProfilePic = async (req,res, next) => {

  try {
    fs.rmSync('./public/images', { recursive: true });
  } catch(err) {
    console.error(err)
  }

  const dir = './public/images';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true
      });
    }

  singleUpload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
    return res.json(err.message);
    }
    else if (err) {
      return res.json(err);
    }
    else if (!req.file) {
      return res.json({"image": req.file, "msg":'Please select an image to upload'});
    }
    if(req.file){

      // console.log(Object.keys(req.query).length)
      // try {
      //   fs.unlinkSync(req.file.path)
      //   //file removed
      // } catch(err) {
      //   console.error(err)
      // }

        const result = await Staff.findOne({username: req.query.username},{_id: 0,image: 1})
        

        if (result.image != null){
          const imageName = result.image.split('/').splice(7)
          console.log('-----------------',imageName)
  
          cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
          {
            invalidate: true,
            resource_type: "raw"
        }, 
          function(error,result) {
            console.log(result, error) 
          }); 
        }

          
      
           
          

      cloudinary.v2.uploader.upload(req.file.path, 
        { resource_type: "raw" }, 
        async function(error, result) {
        console.log('111111111111111111',result, error); 

        
        await Staff.findOneAndUpdate({username: req.query.username},{$set: {image: result.secure_url}})
        const editedStaff = await Staff.findOne({username: req.query.username})
        
        res.json({success: true,
          message: editedStaff,
                     },
        
    );
        });
     
       
    }
       
    });

    
        
  
}

// delete or remove staff
exports.removeStaff = async (req,res,next) => {
  const {username} = req.query;
  try {
    
    await Staff.findOneAndDelete({username: username})
    res.json({success: true, message: `staff with the id ${username} has been removed`})
  } catch (error) {
    console.log(error)
  }
}

// edit staff
exports.editStaff = async (req,res,next) => {
  const {username} = req.query;
  try {
    
    await Staff.findOneAndUpdate({username: username}, req.body)
    res.json({success: true, message: `staff with the username ${username} has been edited`})
  } catch (error) {
    console.log(error)
    
  }
}


/**** TICKET START HERE     ****//////////////////////////////////////////////

// Add ticket
exports.addTicket = async (req,res,next) => {
  const {ticket} = req.body
  ticket.ticketId = randomstring.generate(8)
  let result

  try {
    await Ticket.collection.insertOne(ticket,{new:true})
    result = await Ticket.find({})
    res.json({success: true, message: 'Ticket created successfullty', result, newlyTicket:ticket});
  } catch (error) {
    console.log(error)
  }

  

}

// Add Voucher
exports.addVoucher = async (req,res,next) => {
  const {voucher} = req.body
  voucher.voucherId = randomstring.generate(8)
  let result

  try {
    await Voucher.collection.insertOne(voucher)
    result =  await Voucher.find({})
    res.json({success: true, message: 'Voucher created successfullty', result, newlyVoucher:voucher});
  } catch (error) {
    console.log(error)
  }

  

}



// get all ticket
exports.getAllTicket = async (req,res, next) => {
  try {
    const result = await Ticket.find({});
    result.length > 0
     ? res.json({success: true, message: result,})
     : res.json({success: false, message: result,})
    
  } catch (error) {
    console.log({success: false, error})
    
  }
}

// get all Voucher
exports.getAllVoucher = async (req,res, next) => {
  try {
    const result = await Voucher.find({});
    result.length > 0
     ? res.json({success: true, message: result,})
     : res.json({success: false, message: result,})
    
  } catch (error) {
    console.log({success: false, error})
    
  }
}

// Add event pic
exports.addAnImageToEvent = async (req,res, next) => {
  const {ticketId} = req.query
  let allResults
  try {
    fs.rmSync('./public/images', { recursive: true });
  } catch(err) {
    console.error(err)
  }


  const dir = './public/images';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true
      });
    }

  singleUpload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
    return res.json(err.message);
    }
    else if (err) {
      return res.json(err);
    }
    else if (!req.file) {
      return res.json({"image": req.file, "msg":'Please select an image to upload'});
    }
    if(req.file){
      // console.log('1111111',req.file)

        const result = await Ticket.findOne({ticketId},{_id: 0,image: 1})
        
       
        console.log(result.image)
        if(result.image != null){
        // console.log('222222','hshsisi')

          
        const imageName = result.image.split('/').splice(7)
        console.log('-----------------',imageName)

           cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
          {
            invalidate: true,
              resource_type: "raw"
          }, 
            function(error,result) {
              // console.log('33333333',result, error)
            });  
        }

        cloudinary.v2.uploader.upload(req.file.path, 
        { resource_type: "raw" }, 
        async function(error, result) {
          // console.log('444444',result, error); 

            await Ticket.findOneAndUpdate({ticketId},{$set: {"image": result.secure_url}},{new:true})
            const allResults = await Ticket.find({},{dean:0,departmentList:0})
         
          
          res.json({success: true,
            message: allResults,
                      },
          
          );
        });
     


    }
  });
  
    
        
  
}


// edit ticket
exports.editTicket = async (req,res,next) => {
  let allTicket
  const {ticketId,ticket} = req.body;
  
  try {
    allTicket = await Ticket.findOneAndUpdate({"ticketId":ticketId},ticket,{new:true})
    res.json({success: true, allTicket})
  } catch (error) {
    
  }
  

}

// delete ticket
exports.deleteTicket = async (req,res,next) => {
  let allTicket
  const {ticketId} = req.query;
  
  try {
    const result = await Ticket.findOne({ticketId},{_id: 0,image: 1})
        
       
        console.log(result.image)
        if(result.image != null || result.image != undefined ){
        // console.log('222222','hshsisi')

          
        const imageName = result.image.split('/').splice(7)
        console.log('-----------------',imageName)

           cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
          {
            invalidate: true,
              resource_type: "raw"
          }, 
            function(error,result) {
              // console.log('33333333',result, error)
            });  
        }
    allTicket = await Ticket.findOneAndDelete({"ticketId":ticketId},{new:true})
    res.json({success: true, message:"ticket been deleted successfully", allTicket})
  } catch (error) {
    console.log(error)
  }
  

}

// delete Voucher
exports.deleteVoucher = async (req,res,next) => {
  let allVoucher
  const {voucherId} = req.query;
  
  try {
    allVoucher = await Voucher.findOneAndDelete({"voucherId":voucherId},{new:true})
    res.json({success: true, message:"Voucher been deleted successfully", allVoucher})
  } catch (error) {
    console.log(error)
  }
  

}



