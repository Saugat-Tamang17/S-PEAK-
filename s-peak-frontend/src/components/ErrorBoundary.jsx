import React from "react";

export default class ErrorBoundary extends React.Components{
  consturctor(pops){
    super(props);
    this.state={hasError:false};

  }

  static getDerivedStateFromError(){
    return {hasError:true};
  }
}