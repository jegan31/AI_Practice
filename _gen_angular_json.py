import json, pathlib

cfg = {
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "learning-coach": {
      "projectType": "application",
      "schematics": {
        "@schematics/angular:component": {"style": "scss", "standalone": True},
        "@schematics/angular:directive": {"standalone": True},
        "@schematics/angular:pipe": {"standalone": True}
      },
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "outputPath": "dist/learning-coach",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "polyfills": ["zone.js"],
            "tsConfig": "tsconfig.json",
            "inlineStyleLanguage": "scss",
            "assets": ["src/favicon.ico", "src/assets"],
            "styles": ["src/styles.scss"],
            "scripts": []
          },
          "configurations": {
            "production": {
              "budgets": [
                {"type": "initial", "maximumWarning": "500kB", "maximumError": "1MB"},
                {"type": "anyComponentStyle", "maximumWarning": "4kB", "maximumError": "8kB"}
              ],
              "outputHashing": "all",
              "fileReplacements": [
                {"replace": "src/environments/environment.ts",
                 "with": "src/environments/environment.prod.ts"}
              ]
            },
            "development": {
              "optimization": False,
              "extractLicenses": False,
              "sourceMap": True
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "configurations": {
            "production": {"buildTarget": "learning-coach:build:production"},
            "development": {"buildTarget": "learning-coach:build:development"}
          },
          "defaultConfiguration": "development"
        },
        "test": {
          "builder": "@angular-devkit/build-angular:karma",
          "options": {
            "polyfills": ["zone.js", "zone.js/testing"],
            "tsConfig": "tsconfig.spec.json",
            "inlineStyleLanguage": "scss",
            "assets": ["src/favicon.ico", "src/assets"],
            "styles": ["src/styles.scss"],
            "scripts": []
          }
        }
      }
    }
  }
}

out = pathlib.Path(r"d:/Coding Practices/Learning-Coach/AI_Practice/frontend/angular.json")
out.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
print("angular.json written OK")
