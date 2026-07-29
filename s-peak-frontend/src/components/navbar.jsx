import React from "react";
import {Link, useNavigate,useLocation }from "react-router-dom";
import { clearToken} from "../lib/api"

export default function Navbar(){
  const navigate=useNavigate()
  const location=useLocation()
}

const handleLogout =()=>{
  clearToken();
  navigate("/login");
}