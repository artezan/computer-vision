import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      document.body.classList.toggle('dark', true);
     /*  // Use matchMedia to check the user preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

      toggleDarkTheme(prefersDark.matches);

      // Listen for changes to the prefers-color-scheme media query
      // tslint:disable-next-line: deprecation
      prefersDark.addListener(mediaQuery =>
        toggleDarkTheme(mediaQuery.matches)
      );

      // Add or remove the "dark" class based on if the media query matches
      function toggleDarkTheme(shouldAdd) {
        console.log('is dark', shouldAdd);
        document.body.classList.toggle('dark', shouldAdd);
      } */
    });
  }
}
