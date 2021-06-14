import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { TabsPage } from "./tabs.page";

const routes: Routes = [
  {
    path: "",
    component: TabsPage,
    children: [
      { path: "", redirectTo: "map", pathMatch: "full" },
      {
        path: "map",
        loadChildren: () =>
          import("../map/map.module").then((m) => m.MapPageModule),
      },
      {
        path: "settings",
        loadChildren: () =>
          import("../settings/settings.module").then(
            (m) => m.SettingsPageModule
          ),
      },
      {
        path: "about",
        loadChildren: () =>
          import("../about/about.module").then((m) => m.AboutPageModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule {}
