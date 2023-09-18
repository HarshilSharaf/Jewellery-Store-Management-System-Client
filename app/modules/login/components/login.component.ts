import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/Auth/auth.service';
import { LoggerService } from '../../../../../Backend/Shared/logger.service';
import { MoveDirection, ClickMode, HoverMode, OutMode } from "tsparticles-engine";
import type { Engine, Container } from "tsparticles-engine";
import { loadFull } from "tsparticles";
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit,OnDestroy {
  credentials = { username: '', password: '' };
  errorMessage = '';
  alertClasses = {'d-none':true,'mb-0':true}
  bodyBackground = document.getElementById('body')?.style.background

  id = "tsparticles";

  particlesOptions = {
    // background: {
    //     color: {
    //         value: "blueviolet",
    //     },
    // },
    fpsLimit: 120,
    interactivity: {
        events: {
            onClick: {
                enable: true,
                mode: ClickMode.push,
            },
            onHover: {
                enable: true,
                mode: HoverMode.repulse,
            },
            resize: true,
        },
        modes: {
            push: {
                quantity: 4,
            },
            repulse: {
                distance: 50,
                duration: 1.5,
            },
        },
    },
    particles: {
        color: {
            value: "#ffffff",
        },
        links: {
            color: "#ffffff",
            distance: 150,
            enable: true,
            opacity: 0.5,
            width: 1,
        },
        collisions: {
            enable: true,
        },
        move: {
            direction: MoveDirection.none,
            enable: true,
            outModes: {
                default: OutMode.split,
            },
            random: true,
            speed: 4,
            straight: false,
        },
        number: {
            density: {
                enable: true,
                area: 800,
            },
            value: 100,
        },
        opacity: {
            value: 0.8,
        },
        shape: {
            type: "circle",
        },
        size: {
            value: { min: 1, max: 5 },
        },
    },
    detectRetina: true,
};

  constructor(
    private authService: AuthService,
    private router: Router,
    private loggerService: LoggerService
  ) {}

  ngOnInit(): void {
    document.body.style.background = 'linear-gradient(to right, #00c6ff, #0072ff)'
  }
  
  particlesLoaded(container:Container): void {
}

  async particlesInit(engine:Engine): Promise<void> {
    await loadFull(engine);
  }

  login(e: Event) {
    e.preventDefault();
    this.loggerService.LogInfo("login() Request Started.")
    this.authService.login(this.credentials.username, this.credentials.password)
      .then((response: any) => {
        if(response.status == 200)
        {
          this.loggerService.LogInfo("login() Request Completed.")
          this.router.navigate(['../dashboard'])
        }
      }).catch((error: any) => {
        this.errorMessage = error
        this.alertClasses['d-none'] = false;
        this.loggerService.LogError(error, "login()")
      },)


  }

  ngOnDestroy(): void {
    document.body.style.background = this.bodyBackground || ''
  }

}
