import {React,Component} from 'react';
import { Redirect } from "react-router-dom";
import axios from 'axios';
import queryString from 'query-string';
import KEYS from "../settings.js";


import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Link from '@material-ui/core/Link';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';

import Cookies from 'js-cookie';

class ChangePasswordConfirm extends Component{
    constructor(props){
        super(props);
        this.state = {
            new_password:'',
            new_password_repeat: '',
            flag: false,
            redirect: "/",
            errors: [],
            errorFlag: false,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event){
        this.setState({[event.target.name]: event.target.value});
    }

    handleSubmit(event){
            this.array = []
            this.setState({errors: this.array})
            event.preventDefault();
            const headers = {"X-CSRFTOKEN": Cookies.get('csrftoken')};
            let token = (new URLSearchParams(window.location.search)).get("token")
            const re = new RegExp("(?=.*?\\d)(?=.*?[a-zA-Z])(?=.*?[^\\w\\s]).{8,}");
            if(!event.target[0].value){
                 this.setState(prevState => ({
                  errors: [...prevState.errors, "This field can't be empty."]
                }))
            }
            if(event.target[0].value.length < 8){
                this.setState(prevState => ({
                  errors: [...prevState.errors, "This field must be longer than 8 characters."]
                }))
            }
            if(!re.test(event.target[0].value)){
                this.setState(prevState => ({
                  errors: [...prevState.errors, "This field has to have at least 1 number, 1 letter and 1 character."]
                }))
            }
            if(event.target[0].value !== event.target[2].value){
                this.setState(prevState => ({
                  errors: [...prevState.errors, "The passwords don't match."]
                }))
            }
            setTimeout(() => {
            if(this.state.errors.length == 0){
                axios
                    .put(KEYS.API_URL + 'api/reset-password-confirm/?token=' + token,{
                        new_password: this.state.new_password,
                        new_password_repeat: this.state.new_password_repeat
                    }, {headers: headers})
                    .then(res => {
                        if(res.status == "204"){
                            window.location = '/signin'
                        }
                    })
             }}, 500)

        }

    useStyles = makeStyles((theme) => ({
          paper: {
            marginTop: theme.spacing(8),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          },
          avatar: {
            margin: theme.spacing(1),
            backgroundColor: theme.palette.secondary.main,
          },
          form: {
            width: '100%',
            marginTop: theme.spacing(1),
          },
          submit: {
            margin: theme.spacing(3, 0, 2),
          },
    }));

    render(){
        return(
       <Container component="main" maxWidth="xs" style={{height:"90vh", paddingTop:"5%"}}>
      <CssBaseline />
      <div className={this.useStyles.paper}>
        <Avatar className={this.useStyles.avatar}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Change your password
        </Typography>
        <form className={this.useStyles.form} noValidate onSubmit={ this.handleSubmit }>
          <TextField
            onChange= {this.handleChange}
            value={this.state.new_password}
            variant="outlined"
            margin="normal"
            required
            fullWidth
            type="password"
            id="password"
            label="New Password"
            name="new_password"
            autoFocus
          />
          <TextField
            onChange= {this.handleChange}
            value={this.state.new_password_repeat}
            variant="outlined"
            margin="normal"
            required
            fullWidth
            type="password"
            id="repeat_password"
            label="Repeat New Password"
            name="new_password_repeat"
            autoFocus
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={this.useStyles.submit}
          >
            Submit
          </Button>
          {this.state.errors.length !== 0 ?
          this.state.errors.map((i) => {
                return <h5>{i}</h5>;
            })
          : ''
          }
        </form>
      </div>
    </Container>
    );}
}

export default ChangePasswordConfirm

