Vue.component('alert', {
	template: `
		<div id="alert" class="alert-notify">
			<h2>{{ alert_title }}</h2>
			<div id="alert_content" class="alert-content">{{ alert_message }}
			</div>
			<div class="alert-response">
			  <button v-show="is_confirm_alert" type="button" v-on:click="this.onAlertCancel">{{ cancel_label }}</button>
			  <button type="button" v-on:click="this.onAlertConfirm">{{ confirm_label }}</button>
			</div>
		</div>
	`,

	props: {
		alert_title: String,
		alert_message: String,
		cancel_label: String,
		confirm_label: String,
		is_confirm_alert: Boolean
	},

	data: function () {
		return {
		}
	},

	methods: {
		onAlertCancel () {
			this.$emit('on_alert_cancel')
		},

		onAlertConfirm () {
			this.$emit('on_alert_confirm')
		},
	}
})
