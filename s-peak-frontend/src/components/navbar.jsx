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

const linkStyle = (path) =>({
   fontWeight: location.pathname === path ? 600 : 400,
    color: location.pathname === path ? "#1f3d34" : "#6b7280",
    borderBottom: location.pathname === path ? "2px solid #1f3d34" : "2px solid transparent",
    paddingBottom: 4,
    textDecoration: "none",
    cursor: "pointer",
})
return (
  <header
    style={{
      display:"flex",
      alignItems:"Center",
      justifyContent:"Space-Between",
      padding:"18px 40px",
      background:"#fff",
      borderBottom:"1px solid #12ba9b",
    }}
    >
      {
        <Link
        to="/"
        style={{ fontWeight: 800, fontSize: 20, letterSpacing: "0.02em", color: "#1f3d34", textDecoration: "none" }}
      >
        S-PEAK
      </Link>
      }
  </header>
      
)