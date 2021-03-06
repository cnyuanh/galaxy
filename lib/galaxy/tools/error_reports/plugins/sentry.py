"""The module describes the ``sentry`` error plugin plugin."""
import logging

from galaxy.util import string_as_bool

from ..plugins import ErrorPlugin

log = logging.getLogger( __name__ )


class SentryPlugin( ErrorPlugin ):
    """Send error report to Sentry.
    """
    plugin_type = "sentry"

    def __init__( self, **kwargs ):
        self.app = kwargs['app']
        self.verbose = string_as_bool(kwargs.get('verbose', False))
        self.user_submission = string_as_bool(kwargs.get('user_submission', False))

    def submit_report( self, dataset, job, tool, **kwargs ):
        """Submit the error report to sentry
        """
        if self.app.sentry_client:
            extra = {
                'info' : job.info,
                'id' : job.id,
                'command_line' : job.command_line,
                'stderr' : job.stderr,
                'traceback': job.traceback,
                'exit_code': job.exit_code,
                'stdout': job.stdout,
                'handler': job.handler,
                'user': job.get_user(),
                'tool_version': job.tool_version,
                'tool_xml': tool.config_file if tool else None
            }
            if 'email' in kwargs:
                extra['email'] = kwargs['email']

            if 'message' in kwargs:
                extra['message'] = kwargs['message']

            response = self.app.sentry_client.capture(
                'raven.events.Message',
                message="Galaxy Job Error: %s  v.%s" % (job.tool_id, job.tool_version),
                extra=extra,
            )
            return ( 'Submitted bug report to Sentry. Your guru meditation number is %s' % response, 'success' )


__all__ = ( 'SentryPlugin', )
