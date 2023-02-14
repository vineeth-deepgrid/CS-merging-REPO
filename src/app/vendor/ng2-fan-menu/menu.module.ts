/**
 * menu.module
 */

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { MenuContainerComponent } from './menu-container.component';
import { MenuOptions } from './menu-options.service';
import { MenuWingComponent } from './menu-wing.component';
import { SpinService } from './menu-spin.service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

/* HammerJS */
import 'hammerjs';

@NgModule({
    declarations: [
        // Components / Directives/ Pipes
        MenuContainerComponent,
        MenuWingComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        NgbModule//.forRoot(),
    ],
    exports: [
        MenuContainerComponent,
    ],
    providers: [
        MenuOptions,
        SpinService,
    ]
})
export class FanMenuModule {
}
