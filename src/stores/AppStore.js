import { types, getEnv } from "mobx-state-tree";

import CompletionStore from "./CompletionStore";
import Hotkey from "../core/Hotkey";
import InfoModal from "../components/Infomodal/Infomodal";
import Project from "./ProjectStore";
import Settings from "./SettingsStore";
import Task from "./TaskStore";
import User from "./UserStore";
import Utils from "../utils";

export default types
  .model("AppStore", {
    /**
     * XML config
     */
    config: types.string,

    /**
     * Task with data, id and project
     */
    task: types.maybeNull(Task),

    project: types.maybeNull(Project),

    /**
     * Configure the visual UI shown to the user
     */
    interfaces: types.array(types.string),

    /**
     * Flag for labeling of tasks
     */
    explore: types.optional(types.boolean, false),

    /**
     * Completions Store
     */
    completionStore: types.optional(CompletionStore, {
      completions: [],
      predictions: [],
    }),

    /**
     * User of Label Studio
     */
    user: types.maybeNull(User),

    /**
     * Debug for development environment
     */
    debug: types.optional(types.boolean, true),

    /**
     * Settings of Label Studio
     */
    settings: types.optional(Settings, {}),

    /**
     * Data of description flag
     */
    description: types.maybeNull(types.string),
    // apiCalls: types.optional(types.boolean, true),

    /**
     * Flag for settings
     */
    showingSettings: types.optional(types.boolean, false),
    /**
     * Flag
     * Description of task in Label Studio
     */
    showingDescription: types.optional(types.boolean, false),
    /**
     * Loading of Label Studio
     */
    isLoading: types.optional(types.boolean, false),
    /**
     * Flag for disable task in Label Studio
     */
    noTask: types.optional(types.boolean, false),
    /**
     * Flag for no access to specific task
     */
    noAccess: types.optional(types.boolean, false),
    /**
     * Finish of labeling
     */
    labeledSuccess: types.optional(types.boolean, false),
  })
  .views(self => ({
    /**
     * Get alert
     */
    get alert() {
      return getEnv(self).alert;
    },
  }))
  .actions(self => {
    /**
     * Update settings display state
     */
    function toggleSettings() {
      self.showingSettings = !self.showingSettings;
    }

    /**
     * Update description display state
     */
    function toggleDescription() {
      self.showingDescription = !self.showingDescription;
    }

    function setFlags(flags) {
      const names = ["showingSettings", "showingDescription", "isLoading", "noTask", "noAccess", "labeledSuccess"];

      for (let n of names) if (n in flags) self[n] = flags[n];
    }

    /**
     * Check for interfaces
     * @param {string} name
     * @returns {string | undefined}
     */
    function hasInterface(name) {
      return self.interfaces.find(i => name === i) !== undefined;
    }

    function addInterface(name) {
      return self.interfaces.push(name);
    }

    /**
     * Function
     */
    function afterCreate() {
      /**
       * Hotkey for submit
       */
      Hotkey.addKey("ctrl+enter", self.submitCompletion, "Submit a task");

      /**
       * Hotkey for skip task
       */
      if (self.hasInterface("skip")) Hotkey.addKey("ctrl+space", self.skipTask, "Skip a task");

      /**
       * Hotkey for update completion
       */
      if (self.hasInterface("update")) Hotkey.addKey("alt+enter", self.updateCompletion, "Update a task");

      /**
       * Hotkey for delete
       */
      Hotkey.addKey(
        "ctrl+backspace",
        function() {
          const { selected } = self.completionStore;
          selected.deleteAllRegions();
        },
        "Delete all regions",
      );

      // create relation
      Hotkey.addKey(
        "r",
        function() {
          const c = self.completionStore.selected;
          if (c && c.highlightedNode && !c.relationMode) {
            c.startRelationMode(c.highlightedNode);
          }
        },
        "Create relation when region is selected",
      );

      // unselect region
      Hotkey.addKey("u", function() {
        const c = self.completionStore.selected;
        if (c && c.highlightedNode && !c.relationMode) {
          c.regionStore.unselectAll();
        }
      });

      Hotkey.addKey("h", function() {
        const c = self.completionStore.selected;
        if (c && c.highlightedNode && !c.relationMode) {
          c.highlightedNode.toggleHidden();
        }
      });

      Hotkey.addKey("ctrl+z", function() {
        const { history } = self.completionStore.selected;
        history && history.canUndo && history.undo();
      });
      Hotkey.addKey("ctrl+y", function() {
        const { history } = self.completionStore.selected;
        history && history.canRedo && history.redo();
      });
      Hotkey.addKey("alt+s", function() {
        self.settings.toggleFullscreen();
      });

      Hotkey.addKey(
        "ctrl+escape",
        function() {
          const c = self.completionStore.selected;
          if (c && c.relationMode) {
            c.stopRelationMode();
          }
        },
        "Exit relation mode",
      );

      Hotkey.addKey(
        "backspace",
        function() {
          const c = self.completionStore.selected;
          if (c && c.highlightedNode) {
            const inputName = c.highlightedNode.parent.name;
            c.highlightedNode.deleteRegion();
            const input = document.getElementsByClassName(inputName)[0];
            input.focus();
          }
        },
        "Delete selected region",
      );

      Hotkey.addKey(
        "alt+tab",
        function() {
          const c = self.completionStore.selected;
          c && c.regionStore.selectNext();
        },
        "Circle through entities",
      );

      getEnv(self).onLabelStudioLoad(self);
    }

    /**
     *
     * @param {*} taskObject
     */
    function assignTask(taskObject) {
      if (taskObject && !Utils.Checkers.isString(taskObject.data)) {
        taskObject = {
          ...taskObject,
          [taskObject.data]: JSON.stringify(taskObject.data),
        };
      }
      self.task = Task.create(taskObject);
    }

    /* eslint-disable no-unused-vars */
    function showModal(message, type = "warning") {
      InfoModal[type](message);

      // InfoModal.warning("You need to label at least something!");
    }
    /* eslint-enable no-unused-vars */

    function submitCompletion() {
      const c = self.completionStore.selected;
      c.beforeSend();

      if (!c.validate()) return;

      c.sendUserGenerate();
      getEnv(self).onSubmitCompletion(self, c);
    }

    function updateCompletion() {
      const c = self.completionStore.selected;
      c.beforeSend();

      getEnv(self).onUpdateCompletion(self, c);
    }

    function skipTask() {
      getEnv(self).onSkipTask(self);
    }

    /**
     * Reset completion store
     */
    function resetState() {
      self.completionStore = CompletionStore.create({ completions: [] });

      // const c = self.completionStore.addInitialCompletion();

      // self.completionStore.selectCompletion(c.id);
    }

    /**
     * Function to initilaze completion store
     * Given completions and predictions
     */
    function initializeStore({ completions, predictions }) {
      const _init = (addFun, selectFun) => {
        return item => {
          const obj = self.completionStore[addFun](item);

          self.completionStore[selectFun](obj.id);
          obj.deserializeCompletion(item.result);
          obj.reinitHistory();

          return obj;
        };
      };

      const addPred = _init("addPrediction", "selectPrediction");
      const addComp = _init("addCompletion", "selectCompletion");

      predictions && predictions.forEach(p => addPred(p));
      completions && completions.forEach(c => addComp(c));
    }

    return {
      setFlags,
      addInterface,
      hasInterface,

      afterCreate,
      assignTask,
      resetState,
      initializeStore,

      skipTask,
      submitCompletion,
      updateCompletion,

      toggleSettings,
      toggleDescription,
    };
  });
