import axios from 'axios';
import { Redirect } from "react-router-dom";

export const TokenExpiration = (api_url) =>{
  var timeCreated = sessionStorage.getItem('timeCreated');
  var currentTime= Date.now();

  if(currentTime - timeCreated >= 10000000000){
            axios
            .get(api_url + 'api/logout/',{
                headers: {'Authorization': 'Token ' + sessionStorage.getItem('token')}
            })
            .then(res => {
                sessionStorage.clear();
            })
            return <Redirect to="/signin" />;
        }
}